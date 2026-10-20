import type { FetchLike, TokenManager } from '../auth/token-manager.js';
import { DEFAULT_MAX_RETRIES, DEFAULT_TIMEOUT_MS } from '../constants.js';
import { TdxApiError, TdxAuthError, TdxNetworkError, TdxRateLimitError } from '../errors.js';
import type { RateLimiter } from './rate-limiter.js';
import { isRetryableStatus, parseRetryAfter, retryDelay } from './retry.js';
import { type Sleep, sleep as defaultSleep } from './sleep.js';

/** Passed to `onRequest` before each HTTP attempt to the TDX API (not the token endpoint). */
export interface TdxRequestEvent {
  url: string;
}

/** Passed to `onRetry` just before the client waits and retries a request. */
export interface TdxRetryEvent {
  url: string;
  /** 1 for the first retry, 2 for the second, … */
  attempt: number;
  /**
   * HTTP status that triggered the retry: from the API, or from the token endpoint when getting
   * a token failed. `undefined` for network errors and timeouts.
   */
  status: number | undefined;
  /** How long the client will wait before retrying. */
  delayMs: number;
}

export interface TdxHooks {
  /** Called synchronously before every HTTP attempt, including retries. */
  onRequest?: (event: TdxRequestEvent) => void;
  /** Called synchronously before each backoff wait (429, 5xx, network errors, token outages). */
  onRetry?: (event: TdxRetryEvent) => void;
}

export interface HttpClientOptions extends TdxHooks {
  baseUrl: string;
  tokens: TokenManager;
  rateLimiter: RateLimiter;
  fetch?: FetchLike;
  /** Retries on 429 / 5xx / network errors. Default: 3. */
  maxRetries?: number;
  timeoutMs?: number;
  sleep?: Sleep;
  random?: () => number;
  now?: () => number;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly tokens: TokenManager;
  private readonly rateLimiter: RateLimiter;
  private readonly fetchFn: FetchLike;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;
  private readonly sleep: Sleep;
  private readonly random: () => number;
  private readonly now: () => number;
  private readonly hooks: TdxHooks;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.tokens = options.tokens;
    this.rateLimiter = options.rateLimiter;
    this.fetchFn = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
    this.maxRetries = Math.max(0, options.maxRetries ?? DEFAULT_MAX_RETRIES);
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.sleep = options.sleep ?? defaultSleep;
    this.random = options.random ?? Math.random;
    this.now = options.now ?? Date.now;
    this.hooks = { onRequest: options.onRequest, onRetry: options.onRetry };
  }

  /** Builds the absolute URL for a path (e.g. `/v2/Bike/Station/City/Taipei`) and query string. */
  url(path: string, query = ''): string {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return query ? `${this.baseUrl}${normalized}?${query}` : `${this.baseUrl}${normalized}`;
  }

  /** GETs a URL and returns the parsed JSON body. */
  async getJson(url: string): Promise<unknown> {
    let retries = 0;
    let reauthenticated = false;

    for (;;) {
      await this.rateLimiter.acquire();

      let token: string;
      try {
        token = await this.tokens.getToken();
      } catch (error) {
        // A token endpoint outage is retried like an API one; bad credentials are not.
        if (isTransientAuthError(error) && retries < this.maxRetries) {
          await this.backoff(url, retries++, error.status, error.retryAfterMs);
          continue;
        }
        throw error;
      }

      this.hooks.onRequest?.({ url });

      let response: Response;
      let body: string;
      try {
        response = await this.fetchFn(url, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            'accept-encoding': 'br, gzip',
            authorization: `Bearer ${token}`,
          },
          signal: AbortSignal.timeout(this.timeoutMs),
        });
        // The body can fail or time out after the headers arrive; treat that as a network error.
        body = await response.text();
      } catch (cause) {
        if (retries < this.maxRetries) {
          await this.backoff(url, retries++, undefined, undefined);
          continue;
        }
        throw new TdxNetworkError(`Request failed: GET ${url}`, { url, cause });
      }

      if (response.ok) {
        try {
          return JSON.parse(body) as unknown;
        } catch (cause) {
          throw new TdxApiError(`TDX returned a non-JSON response: GET ${url}`, {
            status: response.status,
            body,
            url,
            cause,
          });
        }
      }

      // An expired or revoked token: fetch a new one and try again, once.
      if (response.status === 401 && !reauthenticated) {
        reauthenticated = true;
        this.tokens.invalidate(token);
        continue;
      }

      const retryAfterMs = parseRetryAfter(response.headers.get('retry-after'), this.now());

      if (isRetryableStatus(response.status) && retries < this.maxRetries) {
        await this.backoff(url, retries++, response.status, retryAfterMs);
        continue;
      }

      const message = `TDX API error ${response.status}${describe(body)}: GET ${url}`;
      if (response.status === 429) {
        throw new TdxRateLimitError(message, { body, url, retryAfterMs });
      }
      throw new TdxApiError(message, { status: response.status, body, url });
    }
  }

  private async backoff(
    url: string,
    retry: number,
    status: number | undefined,
    retryAfterMs: number | undefined,
  ): Promise<void> {
    const delayMs = retryDelay(retry, retryAfterMs, this.random);
    this.hooks.onRetry?.({ url, attempt: retry + 1, status, delayMs });
    await this.sleep(delayMs);
  }
}

/** A token request that failed with a network error, 429 or 5xx (not 400/401 or bad JSON). */
function isTransientAuthError(error: unknown): error is TdxAuthError {
  return (
    error instanceof TdxAuthError && (error.status === undefined || isRetryableStatus(error.status))
  );
}

/** Extracts TDX's `{"Message": "..."}` error text for a readable error message. */
function describe(body: string): string {
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    const message = parsed.Message ?? parsed.message;
    if (typeof message === 'string' && message) return ` (${message})`;
  } catch {
    // not JSON — fall through
  }
  const text = body.trim();
  return text && text.length <= 200 ? ` (${text})` : '';
}
