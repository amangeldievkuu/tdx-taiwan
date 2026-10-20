import { type FetchLike, TokenManager } from './auth/token-manager.js';
import { TtlCache } from './cache/ttl-cache.js';
import { DEFAULT_BASE_URL, DEFAULT_REQUESTS_PER_SECOND } from './constants.js';
import { TdxApiError } from './errors.js';
import { HttpClient, type TdxHooks } from './http/http-client.js';
import { RateLimiter } from './http/rate-limiter.js';
import { type ODataOptions, ODataQuery } from './odata/query-builder.js';
import { BikeApi } from './resources/bike.js';
import { BusApi } from './resources/bus.js';
import { MetroApi } from './resources/metro.js';
import { ThsrApi } from './resources/thsr.js';
import type { CacheClass, ListRequester, ObjectRequester } from './resources/requester.js';

export interface TdxCacheOptions {
  /** TTL for static data: bike stations, bus routes, stops of route. Default: 1 hour. */
  staticTtlMs?: number;
  /** TTL for real-time data: bike availability, bus ETA. Default: 15 seconds. */
  realtimeTtlMs?: number;
  /** Maximum number of cached responses (one per distinct URL). Default: 500. */
  maxEntries?: number;
}

export interface TdxClientOptions extends TdxHooks {
  /** TDX API key Client Id (會員中心 → 資料服務 → API金鑰). */
  clientId: string;
  /** TDX API key Client Secret. */
  clientSecret: string;
  /** API base URL. Default: `https://tdx.transportdata.tw/api/basic`. */
  baseUrl?: string;
  /** Override the OAuth2 token endpoint. */
  authUrl?: string;
  /** Custom fetch implementation. Defaults to the global `fetch` (Node 20+). */
  fetch?: FetchLike;
  /**
   * Client-side rate limit. Requests are spaced evenly at this rate. Match it to your TDX
   * subscription plan. `0` disables limiting. Default: 5.
   */
  requestsPerSecond?: number;
  /** Retries for 429, 5xx and network errors, with exponential backoff + jitter. Default: 3. */
  maxRetries?: number;
  /** Per-request timeout in milliseconds. Default: 30000. */
  timeoutMs?: number;
  /**
   * In-memory response cache, keyed by URL. Off by default; `true` uses the default TTLs.
   * Identical concurrent requests share one HTTP call while the cache is on.
   */
  cache?: boolean | TdxCacheOptions;
}

const DEFAULT_CACHE: Required<TdxCacheOptions> = {
  staticTtlMs: 60 * 60 * 1000,
  realtimeTtlMs: 15 * 1000,
  maxEntries: 500,
};

export class TdxClient {
  /** Public bike (YouBike) endpoints. */
  readonly bike: BikeApi;
  /** City bus endpoints. */
  readonly bus: BusApi;
  /** Metro, light rail and gondola endpoints. */
  readonly metro: MetroApi;
  /** Taiwan High Speed Rail (高鐵) endpoints. */
  readonly thsr: ThsrApi;

  private readonly tokens: TokenManager;
  private readonly http: HttpClient;
  private readonly cacheConfig: Required<TdxCacheOptions> | undefined;
  private readonly cache: TtlCache<Promise<unknown>> | undefined;

  constructor(options: TdxClientOptions) {
    // Runtime guard for JavaScript callers, who may pass nothing at all.
    const given = options as Partial<TdxClientOptions> | undefined;
    if (!given?.clientId || !given.clientSecret) {
      throw new TypeError('TdxClient requires both clientId and clientSecret');
    }
    this.tokens = new TokenManager({
      clientId: options.clientId,
      clientSecret: options.clientSecret,
      authUrl: options.authUrl,
      fetch: options.fetch,
      timeoutMs: options.timeoutMs,
    });
    this.http = new HttpClient({
      baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
      tokens: this.tokens,
      rateLimiter: new RateLimiter(options.requestsPerSecond ?? DEFAULT_REQUESTS_PER_SECOND),
      fetch: options.fetch,
      maxRetries: options.maxRetries,
      timeoutMs: options.timeoutMs,
      onRequest: options.onRequest,
      onRetry: options.onRetry,
    });

    if (options.cache) {
      this.cacheConfig = {
        ...DEFAULT_CACHE,
        ...(options.cache === true ? {} : withoutUndefined(options.cache)),
      };
      this.cache = new TtlCache(this.cacheConfig.maxEntries);
    }

    const list: ListRequester = (path, query, cacheClass) =>
      this.request(path, query, cacheClass, 'array') as Promise<never[]>;
    const object: ObjectRequester = (path, query, cacheClass) =>
      this.request(path, query, cacheClass, 'object') as Promise<never>;
    this.bike = new BikeApi(list);
    this.bus = new BusApi(list);
    this.metro = new MetroApi(list, object);
    this.thsr = new ThsrApi(list, object);
  }

  /** Returns a valid OAuth2 access token (cached in memory, refreshed 60s before expiry). */
  getAccessToken(): Promise<string> {
    return this.tokens.getToken();
  }

  /**
   * Low-level GET for any TDX endpoint not wrapped by this SDK yet, with auth, rate
   * limiting, retries and `$format=JSON` applied. Not cached.
   *
   * @example tdx.get<BusRoute[]>('/v2/Bus/Route/InterCity', { top: 10 })
   */
  async get<T = unknown, Item = Record<string, unknown>>(
    path: string,
    query?: ODataQuery<Item> | ODataOptions<Item>,
  ): Promise<T> {
    const q = ODataQuery.from(query).toString();
    return (await this.http.getJson(this.http.url(path, q))) as T;
  }

  /** Empties the response cache. */
  clearCache(): void {
    this.cache?.clear();
  }

  private async request<T>(
    path: string,
    query: ODataQuery<T> | ODataOptions<T> | undefined,
    cacheClass: CacheClass,
    shape: Shape,
  ): Promise<unknown> {
    const url = this.http.url(path, ODataQuery.from(query).toString());
    if (!this.cache || !this.cacheConfig) return this.fetchShape(url, shape);

    let pending = this.cache.get(url);
    if (!pending) {
      const ttl =
        cacheClass === 'static' ? this.cacheConfig.staticTtlMs : this.cacheConfig.realtimeTtlMs;
      pending = this.fetchShape(url, shape);
      this.cache.set(url, pending, ttl);
      // Never cache failures.
      pending.catch(() => this.cache?.delete(url, pending));
    }
    // Callers get their own copy so mutating a result cannot corrupt the cache.
    return structuredClone(await pending);
  }

  private async fetchShape(url: string, shape: Shape): Promise<unknown> {
    const data = await this.http.getJson(url);
    const ok =
      shape === 'array'
        ? Array.isArray(data)
        : typeof data === 'object' && data !== null && !Array.isArray(data);
    if (!ok) {
      throw new TdxApiError(`Expected a JSON ${shape} from TDX: GET ${url}`, {
        status: 200,
        body: JSON.stringify(data),
        url,
      });
    }
    return data;
  }
}

/** The JSON shape an endpoint returns. */
type Shape = 'array' | 'object';

function withoutUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}
