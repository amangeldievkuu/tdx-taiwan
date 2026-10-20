/**
 * Hits the live TDX API. Runs only when TDX_CLIENT_ID and TDX_CLIENT_SECRET are set
 * (in the environment or in .env). Run with: npm run test:integration
 */
import { existsSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { TdxClient, query, type BikeStation } from '../../src/index.js';

if (existsSync('.env')) process.loadEnvFile('.env');

const clientId = process.env.TDX_CLIENT_ID;
const clientSecret = process.env.TDX_CLIENT_SECRET;
const hasCredentials = Boolean(clientId && clientSecret);

describe.skipIf(!hasCredentials)('live TDX API', () => {
  let tdx: TdxClient;

  beforeAll(() => {
    tdx = new TdxClient({
      clientId: clientId ?? '',
      clientSecret: clientSecret ?? '',
      requestsPerSecond: 2,
    });
  });

  it('obtains an access token', async () => {
    const token = await tdx.getAccessToken();
    expect(token.length).toBeGreaterThan(20);
  });

  it('bike.stations returns Taipei stations', async () => {
    const stations = await tdx.bike.stations('Taipei', query<BikeStation>().top(3));
    expect(stations.length).toBeGreaterThan(0);
    expect(stations[0]).toHaveProperty('UpdateTime');
    expect(stations[0]?.StationName?.Zh_tw).toEqual(expect.any(String));
    expect(stations[0]?.StationPosition?.PositionLat).toEqual(expect.any(Number));
  });

  it('bike.availability returns Taipei availability', async () => {
    const availability = await tdx.bike.availability('Taipei', { top: 3 });
    expect(availability.length).toBeGreaterThan(0);
    expect(availability[0]).toHaveProperty('UpdateTime');
    expect(availability[0]).toHaveProperty('StationUID');
  });

  it('bus.routes returns route 307', async () => {
    const routes = await tdx.bus.routes('Taipei', '307');
    expect(routes.some((r) => r.RouteName.Zh_tw === '307')).toBe(true);
    expect(routes[0]).toHaveProperty('RouteUID');
  });

  it('bus.stopsOfRoute returns ordered stops for 307', async () => {
    const result = await tdx.bus.stopsOfRoute('Taipei', '307');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]?.Stops.length).toBeGreaterThan(1);
    expect(result[0]?.Stops[0]).toHaveProperty('StopSequence');
  });

  it('bus.eta returns estimates for 307', async () => {
    const eta = await tdx.bus.eta('Taipei', '307');
    expect(Array.isArray(eta)).toBe(true);
    if (eta.length) expect(eta[0]).toHaveProperty('Direction');
  });
});

describe.skipIf(hasCredentials)('live TDX API (skipped)', () => {
  it.skip('set TDX_CLIENT_ID and TDX_CLIENT_SECRET in .env to run the live tests', () => {});
});
