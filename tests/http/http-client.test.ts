import { describe, expect, it, vi } from 'vitest';
import { TokenManager } from '../../src/auth/token-manager.js';
import { TdxApiError, TdxNetworkError, TdxRateLimitError } from '../../src/errors.js';
import { HttpClient, type TdxHooks } from '../../src/http/http-client.js';
import { RateLimiter } from '../../src/http/rate-limiter.js';
import { jsonResponse, textResponse, tokenResponse } from '../helpers.js';

const BASE = 'https://tdx.example/api/basic';
const URL = `${BASE}/v2/Bike/Station/City/Taipei?$format=JSON`;

/** API responses are served in order; token requests always succeed with a new token. */
function setup(apiResponses: Array<Response | Error>, maxRetries?: number, hooks: TdxHooks = {}) {
  let tokenCount = 0;
  const apiCalls: Array<{ url: string; init: RequestInit }> = [];
  const fetch = vi.fn((url: string, init?: RequestInit) => {
    if (url.includes('/token')) return Promise.resolve(tokenResponse(`token-${++tokenCount}`));
    apiCalls.push({ url, init: init ?? {} });
    const next = apiResponses.shift();
    if (!next) return Promise.reject(new Error('unexpected API call'));
    if (next instanceof Error) return Promise.reject(next);
    return Promise.resolve(next);
  });
  const sleeps: number[] = [];
  const sleep = (ms: number) => {
    sleeps.push(ms);
    return Promise.resolve();
  };
  const tokens = new TokenManager({
    clientId: 'id',
    clientSecret: 'secret',
    authUrl: 'https://tdx.example/token',
    fetch,
  });
  const http = new HttpClient({
    baseUrl: `${BASE}/`,
    tokens,
    rateLimiter: new RateLimiter(0),
    fetch,
    maxRetries,
    sleep,
    random: () => 0.5,
    now: () => Date.parse('2026-10-20T00:00:00Z'),
    ...hooks,
  });
  return { http, apiCalls, sleeps, tokenCount: () => tokenCount };
}

describe('HttpClient', () => {
  it('builds URLs from the base URL, path and query', () => {
    const { http } = setup([]);
    expect(http.url('/v2/Bike/Station/City/Taipei', '$format=JSON')).toBe(URL);
    expect(http.url('v2/x')).toBe(`${BASE}/v2/x`);
  });

  it('sends the bearer token and compression headers, and parses JSON', async () => {
    const { http, apiCalls } = setup([jsonResponse([{ StationUID: 'TPE1' }])]);

    await expect(http.getJson(URL)).resolves.toEqual([{ StationUID: 'TPE1' }]);

    expect(apiCalls).toHaveLength(1);
    expect(apiCalls[0]?.init.headers).toMatchObject({
      authorization: 'Bearer token-1',
      accept: 'application/json',
      'accept-encoding': 'br, gzip',
    });
  });

  it('retries 5xx with exponential backoff and jitter, then succeeds', async () => {
    const { http, apiCalls, sleeps } = setup([
      textResponse('busy', 503),
      textResponse('busy', 502),
      jsonResponse([]),
    ]);

    await expect(http.getJson(URL)).resolves.toEqual([]);

    expect(apiCalls).toHaveLength(3);
    // random() = 0.5 → half of 500·2^n
    expect(sleeps).toEqual([250, 500]);
  });

  it('gives up after 3 retries with TdxApiError carrying status and body', async () => {
    const body = '{"Message":"Service Unavailable"}';
    const { http, apiCalls, sleeps } = setup(
      Array.from({ length: 4 }, () => textResponse(body, 503)),
    );

    const error = await http.getJson(URL).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(TdxApiError);
    expect(error).not.toBeInstanceOf(TdxRateLimitError);
    expect(error).toMatchObject({ status: 503, body, url: URL });
    expect((error as Error).message).toContain('503 (Service Unavailable)');
    expect(apiCalls).toHaveLength(4);
    expect(sleeps).toEqual([250, 500, 1000]);
  });

  it('honours maxRetries', async () => {
    const { http, apiCalls } = setup([textResponse('x', 500), textResponse('x', 500)], 1);

    await expect(http.getJson(URL)).rejects.toBeInstanceOf(TdxApiError);
    expect(apiCalls).toHaveLength(2);
  });

  it('retries 429 using Retry-After, then throws TdxRateLimitError', async () => {
    const { http, sleeps } = setup(
      Array.from({ length: 4 }, () => textResponse('slow down', 429, { 'retry-after': '2' })),
    );

    const error = await http.getJson(URL).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(TdxRateLimitError);
    expect(error).toBeInstanceOf(TdxApiError);
    expect(error).toMatchObject({ status: 429, body: 'slow down', retryAfterMs: 2000 });
    expect(sleeps).toEqual([2000, 2000, 2000]);
  });

  it('recovers from a 429 without Retry-After', async () => {
    const { http, sleeps } = setup([textResponse('', 429), jsonResponse([1])]);

    await expect(http.getJson(URL)).resolves.toEqual([1]);
    expect(sleeps).toEqual([250]);
  });

  it('does not retry other 4xx errors', async () => {
    const { http, apiCalls, sleeps } = setup([
      jsonResponse({ Message: 'City not supported' }, 404),
    ]);

    const error = await http.getJson(URL).catch((e: unknown) => e);

    expect(error).toMatchObject({ status: 404, name: 'TdxApiError' });
    expect((error as Error).message).toContain('City not supported');
    expect(apiCalls).toHaveLength(1);
    expect(sleeps).toEqual([]);
  });

  it('refreshes the token once on 401 and retries', async () => {
    const { http, apiCalls, tokenCount } = setup([textResponse('expired', 401), jsonResponse([])]);

    await expect(http.getJson(URL)).resolves.toEqual([]);

    expect(tokenCount()).toBe(2);
    expect(apiCalls.map((c) => (c.init.headers as Record<string, string>).authorization)).toEqual([
      'Bearer token-1',
      'Bearer token-2',
    ]);
  });

  it('throws on a second consecutive 401', async () => {
    const { http, apiCalls } = setup([textResponse('no', 401), textResponse('still no', 401)]);

    await expect(http.getJson(URL)).rejects.toMatchObject({ status: 401, body: 'still no' });
    expect(apiCalls).toHaveLength(2);
  });

  it('retries network errors, then throws TdxNetworkError', async () => {
    const cause = new TypeError('fetch failed');
    const { http, apiCalls } = setup([cause, cause, cause, cause]);

    const error = await http.getJson(URL).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(TdxNetworkError);
    expect(error).toMatchObject({ url: URL, cause });
    expect(apiCalls).toHaveLength(4);
  });

  it('throws TdxApiError on a non-JSON success body', async () => {
    const { http } = setup([textResponse('<html>maintenance</html>', 200)]);

    await expect(http.getJson(URL)).rejects.toMatchObject({
      name: 'TdxApiError',
      status: 200,
      body: '<html>maintenance</html>',
    });
  });

  describe('hooks', () => {
    it('calls onRequest before every attempt, including retries and re-authentication', async () => {
      const onRequest = vi.fn();
      const { http } = setup(
        [textResponse('busy', 503), textResponse('expired', 401), jsonResponse([])],
        3,
        { onRequest },
      );

      await http.getJson(URL);

      expect(onRequest.mock.calls).toEqual([[{ url: URL }], [{ url: URL }], [{ url: URL }]]);
    });

    it('calls onRetry with the attempt, status and delay before each backoff', async () => {
      const onRetry = vi.fn();
      const cause = new TypeError('fetch failed');
      const { http, sleeps } = setup(
        [
          textResponse('busy', 503),
          textResponse('slow', 429, { 'retry-after': '3' }),
          cause,
          jsonResponse([]),
        ],
        3,
        { onRetry },
      );

      await http.getJson(URL);

      expect(onRetry.mock.calls.map(([event]) => event as unknown)).toEqual([
        { url: URL, attempt: 1, status: 503, delayMs: 250 },
        { url: URL, attempt: 2, status: 429, delayMs: 3000 },
        { url: URL, attempt: 3, status: undefined, delayMs: 1000 },
      ]);
      expect(sleeps).toEqual([250, 3000, 1000]);
    });

    it('does not call onRetry for the 401 re-authentication or for non-retryable errors', async () => {
      const onRetry = vi.fn();
      const { http } = setup([textResponse('expired', 401), textResponse('nope', 404)], 3, {
        onRetry,
      });

      await expect(http.getJson(URL)).rejects.toMatchObject({ status: 404 });
      expect(onRetry).not.toHaveBeenCalled();
    });
  });
});
