import { DEFAULT_AUTH_URL, DEFAULT_TIMEOUT_MS, TOKEN_REFRESH_MARGIN_MS } from '../constants.js';
import { TdxAuthError } from '../errors.js';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface TokenManagerOptions {
  clientId: string;
  clientSecret: string;
  /** Token endpoint. Defaults to the TDXConnect realm. */
  authUrl?: string;
  fetch?: FetchLike;
  /** Clock in epoch milliseconds; injectable for tests. */
  now?: () => number;
  timeoutMs?: number;
}

interface CachedToken {
  accessToken: string;
  /** Epoch ms after which the token must be refreshed. */
  refreshAt: number;
}

/**
 * OAuth2 client-credentials token cache.
 *
 * - Tokens are kept in memory and refreshed 60s before they expire.
 * - Concurrent callers share a single in-flight token request.
 */
export class TokenManager {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly authUrl: string;
  private readonly fetchFn: FetchLike;
  private readonly now: () => number;
  private readonly timeoutMs: number;

  private cached: CachedToken | undefined;
  private inflight: Promise<string> | undefined;

  constructor(options: TokenManagerOptions) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.authUrl = options.authUrl ?? DEFAULT_AUTH_URL;
    this.fetchFn = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
    this.now = options.now ?? Date.now;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  /** Returns a valid access token, fetching a new one only when needed. */
  getToken(): Promise<string> {
    if (this.cached && this.now() < this.cached.refreshAt) {
      return Promise.resolve(this.cached.accessToken);
    }
    this.inflight ??= this.requestToken().finally(() => {
      this.inflight = undefined;
    });
    return this.inflight;
  }

  /** Drops the cached token so the next `getToken()` fetches a fresh one (e.g. after a 401). */
  invalidate(): void {
    this.cached = undefined;
  }

  private async requestToken(): Promise<string> {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    let response: Response;
    try {
      response = await this.fetchFn(this.authUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (cause) {
      throw new TdxAuthError('Token request failed: network error', { cause });
    }

    const text = await response.text();
    if (!response.ok) {
      throw new TdxAuthError(`Token request failed with HTTP ${response.status}`, {
        status: response.status,
        body: text,
      });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch (cause) {
      throw new TdxAuthError('Token response is not valid JSON', {
        status: response.status,
        body: text,
        cause,
      });
    }

    const { access_token: accessToken, expires_in: expiresIn } = (payload ?? {}) as Record<
      string,
      unknown
    >;
    if (typeof accessToken !== 'string' || accessToken === '' || typeof expiresIn !== 'number') {
      throw new TdxAuthError('Token response is missing access_token or expires_in', {
        status: response.status,
        body: text,
      });
    }

    const expiresInMs = expiresIn * 1000;
    // Very short-lived tokens would otherwise be "stale" immediately; refresh halfway instead.
    const margin = Math.min(TOKEN_REFRESH_MARGIN_MS, expiresInMs / 2);
    this.cached = { accessToken, refreshAt: this.now() + expiresInMs - margin };
    return accessToken;
  }
}
