import { describe, expect, it, vi } from 'vitest';
import { TdxClient, query } from '../src/index.js';
import { jsonResponse, tokenResponse } from './helpers.js';

function mockFetch(apiBody: unknown = []) {
  return vi.fn((url: string, _init?: RequestInit) =>
    Promise.resolve(url.includes('/token') ? tokenResponse('abc') : jsonResponse(apiBody)),
  );
}

describe('TdxClient', () => {
  it('requires clientId and clientSecret', () => {
    expect(() => new TdxClient({ clientId: '', clientSecret: 'x' })).toThrow(TypeError);
    expect(() => new TdxClient({ clientId: 'x', clientSecret: '' })).toThrow(TypeError);
  });

  it('exposes a cached access token', async () => {
    const fetch = mockFetch();
    const tdx = new TdxClient({ clientId: 'id', clientSecret: 'secret', fetch });

    await expect(tdx.getAccessToken()).resolves.toBe('abc');
    await expect(tdx.getAccessToken()).resolves.toBe('abc');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('get() calls arbitrary endpoints with auth and an OData query', async () => {
    const fetch = mockFetch([{ RouteUID: 'THB1' }]);
    const tdx = new TdxClient({
      clientId: 'id',
      clientSecret: 'secret',
      fetch,
      requestsPerSecond: 0,
    });

    await expect(tdx.get('/v2/Bus/Route/InterCity', query().top(1))).resolves.toEqual([
      { RouteUID: 'THB1' },
    ]);
    await tdx.get('v2/Bus/Route/InterCity', { select: ['RouteUID'] });

    const urls = fetch.mock.calls.map(([url]) => url).filter((u) => !u.includes('/token'));
    expect(urls).toEqual([
      'https://tdx.transportdata.tw/api/basic/v2/Bus/Route/InterCity?$top=1&$format=JSON',
      'https://tdx.transportdata.tw/api/basic/v2/Bus/Route/InterCity?$select=RouteUID&$format=JSON',
    ]);
    expect(fetch.mock.calls[1]?.[1]?.headers).toMatchObject({ authorization: 'Bearer abc' });
  });

  it('honours a custom baseUrl', async () => {
    const fetch = mockFetch();
    const tdx = new TdxClient({
      clientId: 'id',
      clientSecret: 'secret',
      fetch,
      baseUrl: 'https://proxy.example/tdx/',
    });

    await tdx.get('/v2/x');
    expect(fetch.mock.calls[1]?.[0]).toBe('https://proxy.example/tdx/v2/x?$format=JSON');
  });

  it('forwards onRequest / onRetry hooks to the HTTP layer', async () => {
    const onRequest = vi.fn();
    const tdx = new TdxClient({
      clientId: 'id',
      clientSecret: 'secret',
      fetch: mockFetch([]),
      requestsPerSecond: 0,
      onRequest,
    });

    await tdx.bike.stations('Taipei');

    expect(onRequest).toHaveBeenCalledWith({
      url: 'https://tdx.transportdata.tw/api/basic/v2/Bike/Station/City/Taipei?$format=JSON',
    });
  });
});
