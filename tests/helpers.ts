import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { vi } from 'vitest';
import { TdxClient, type TdxClientOptions } from '../src/index.js';

export function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

export function textResponse(body: string, status: number, headers: Record<string, string> = {}) {
  return new Response(body, { status, headers });
}

export function tokenResponse(accessToken = 'token-1', expiresIn = 86_400) {
  return jsonResponse({ access_token: accessToken, expires_in: expiresIn, token_type: 'Bearer' });
}

/** A manually advanced clock. */
export function fakeClock(start = 1_700_000_000_000) {
  let t = start;
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms;
    },
  };
}

/** Parsed JSON fixture; callers cast it to the response type it represents. */
export function loadFixture(name: string): unknown {
  const path = fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * A TdxClient whose fetch serves a token for the auth URL and `body` for every API call.
 * Returned `apiUrls` lists the API URLs requested, in order.
 */
export function clientWithResponse(body: unknown, options: Partial<TdxClientOptions> = {}) {
  const apiUrls: string[] = [];
  const fetch = vi.fn((url: string) => {
    if (url.includes('/openid-connect/token')) return Promise.resolve(tokenResponse('abc'));
    apiUrls.push(url);
    return Promise.resolve(jsonResponse(body));
  });
  const tdx = new TdxClient({
    clientId: 'id',
    clientSecret: 'secret',
    fetch,
    requestsPerSecond: 0,
    ...options,
  });
  return { tdx, fetch, apiUrls };
}

export const API = 'https://tdx.transportdata.tw/api/basic';
