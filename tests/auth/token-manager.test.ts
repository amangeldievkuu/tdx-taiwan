import { describe, expect, it, vi } from 'vitest';
import { TokenManager } from '../../src/auth/token-manager.js';
import { DEFAULT_AUTH_URL } from '../../src/constants.js';
import { TdxAuthError } from '../../src/errors.js';
import { fakeClock, jsonResponse, textResponse, tokenResponse } from '../helpers.js';

function setup(responses: Array<Response | Error>) {
  const clock = fakeClock();
  const fetch = vi.fn(() => {
    const next = responses.shift();
    if (!next) return Promise.reject(new Error('unexpected fetch call'));
    if (next instanceof Error) return Promise.reject(next);
    return Promise.resolve(next);
  });
  const manager = new TokenManager({
    clientId: 'my-id',
    clientSecret: 'my-secret',
    fetch,
    now: clock.now,
  });
  return { manager, fetch, clock };
}

describe('TokenManager', () => {
  it('posts client credentials as form data to the TDXConnect token endpoint', async () => {
    const { manager, fetch } = setup([tokenResponse('abc')]);

    await expect(manager.getToken()).resolves.toBe('abc');

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(DEFAULT_AUTH_URL);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'content-type': 'application/x-www-form-urlencoded' });
    const body = new URLSearchParams(init.body as URLSearchParams);
    expect(Object.fromEntries(body)).toEqual({
      grant_type: 'client_credentials',
      client_id: 'my-id',
      client_secret: 'my-secret',
    });
  });

  it('caches the token in memory', async () => {
    const { manager, fetch, clock } = setup([tokenResponse('abc')]);

    await manager.getToken();
    clock.advance(60 * 60 * 1000);
    await expect(manager.getToken()).resolves.toBe('abc');

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('refreshes exactly 60 seconds before expiry', async () => {
    const { manager, fetch, clock } = setup([
      tokenResponse('first', 3600),
      tokenResponse('second'),
    ]);

    await manager.getToken();
    clock.advance(3600_000 - 60_000 - 1);
    await expect(manager.getToken()).resolves.toBe('first');
    expect(fetch).toHaveBeenCalledTimes(1);

    clock.advance(1);
    await expect(manager.getToken()).resolves.toBe('second');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('refreshes halfway through the lifetime of very short-lived tokens', async () => {
    const { manager, fetch, clock } = setup([tokenResponse('short', 30), tokenResponse('next')]);

    await manager.getToken();
    clock.advance(14_999);
    await expect(manager.getToken()).resolves.toBe('short');
    clock.advance(1);
    await expect(manager.getToken()).resolves.toBe('next');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('deduplicates concurrent refreshes into one token request', async () => {
    const { manager, fetch } = setup([tokenResponse('shared')]);

    const tokens = await Promise.all(Array.from({ length: 10 }, () => manager.getToken()));

    expect(tokens).toEqual(Array(10).fill('shared'));
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent refreshes when the cached token goes stale', async () => {
    const { manager, fetch, clock } = setup([tokenResponse('old', 3600), tokenResponse('new')]);

    await manager.getToken();
    clock.advance(3600_000);
    const tokens = await Promise.all([manager.getToken(), manager.getToken(), manager.getToken()]);

    expect(tokens).toEqual(['new', 'new', 'new']);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('shares a failed refresh with all concurrent callers, then retries on the next call', async () => {
    const { manager, fetch } = setup([
      textResponse('{"error":"invalid_client"}', 401),
      tokenResponse('recovered'),
    ]);

    const results = await Promise.allSettled([manager.getToken(), manager.getToken()]);
    expect(results.map((r) => r.status)).toEqual(['rejected', 'rejected']);
    expect(fetch).toHaveBeenCalledTimes(1);

    await expect(manager.getToken()).resolves.toBe('recovered');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('throws TdxAuthError with status and body on HTTP errors', async () => {
    const { manager } = setup([textResponse('{"error":"invalid_client"}', 401)]);

    const error = await manager.getToken().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(TdxAuthError);
    expect(error).toMatchObject({
      name: 'TdxAuthError',
      status: 401,
      body: '{"error":"invalid_client"}',
    });
  });

  it('wraps network failures in TdxAuthError', async () => {
    const networkError = new TypeError('fetch failed');
    const { manager } = setup([networkError]);

    const error = await manager.getToken().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(TdxAuthError);
    expect((error as TdxAuthError).cause).toBe(networkError);
    expect((error as TdxAuthError).status).toBeUndefined();
  });

  it('wraps a token response body that fails mid-stream in TdxAuthError', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"access_token":'));
        controller.error(new TypeError('terminated'));
      },
    });
    const { manager } = setup([new Response(stream, { status: 200 })]);

    const error = await manager.getToken().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(TdxAuthError);
    expect((error as TdxAuthError).status).toBeUndefined();
    expect((error as TdxAuthError).cause).toMatchObject({ message: 'terminated' });
  });

  it('reports Retry-After on a rate-limited token request', async () => {
    const { manager } = setup([textResponse('slow down', 429, { 'retry-after': '5' })]);

    await expect(manager.getToken()).rejects.toMatchObject({ status: 429, retryAfterMs: 5000 });
  });

  it('rejects malformed token responses', async () => {
    const { manager } = setup([
      jsonResponse({ token_type: 'Bearer' }),
      textResponse('<html>', 200),
    ]);

    await expect(manager.getToken()).rejects.toThrow(/missing access_token/);
    await expect(manager.getToken()).rejects.toThrow(/not valid JSON/);
  });

  it('invalidate() forces the next call to fetch a new token', async () => {
    const { manager, fetch } = setup([tokenResponse('one'), tokenResponse('two')]);

    await manager.getToken();
    manager.invalidate();
    await expect(manager.getToken()).resolves.toBe('two');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('invalidate(usedToken) keeps a newer token that another request already fetched', async () => {
    const { manager, fetch } = setup([tokenResponse('one'), tokenResponse('two')]);

    await manager.getToken();
    manager.invalidate('one'); // first 401: drop "one"
    await expect(manager.getToken()).resolves.toBe('two');
    manager.invalidate('one'); // a late 401 for "one" must not drop "two"

    await expect(manager.getToken()).resolves.toBe('two');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
