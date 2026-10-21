/**
 * Hits the live TDX API. Runs only when TDX_CLIENT_ID and TDX_CLIENT_SECRET are set
 * (in the environment or in .env). Run with: npm run test:integration
 */
import { existsSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { TdxClient, query, trainDate, type BikeStation } from '../../src/index.js';

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

  it('bus.routes returns exactly route 307', async () => {
    const routes = await tdx.bus.routes('Taipei', '307');
    expect(routes.length).toBeGreaterThan(0);
    expect(routes.every((r) => r.RouteName.Zh_tw === '307')).toBe(true);
    expect(routes[0]).toHaveProperty('RouteUID');
  });

  it('bus.routes with exact: false keeps TDX prefix matching', async () => {
    const routes = await tdx.bus.routes('Taipei', '307', { exact: false });
    expect(routes.every((r) => r.RouteName.Zh_tw.startsWith('307'))).toBe(true);
    expect(routes.some((r) => r.RouteName.Zh_tw !== '307')).toBe(true);
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
    expect(eta.every((e) => e.RouteName?.Zh_tw === '307')).toBe(true);
    if (eta.length) expect(eta[0]).toHaveProperty('Direction');
  });
});

describe.skipIf(!hasCredentials)('live TDX API: metro', () => {
  let tdx: TdxClient;

  beforeAll(() => {
    tdx = new TdxClient({
      clientId: clientId ?? '',
      clientSecret: clientSecret ?? '',
      requestsPerSecond: 2,
    });
  });

  it('metro.stations returns Taipei Metro stations', async () => {
    const stations = await tdx.metro.stations('TRTC', { top: 3 });
    expect(stations.length).toBeGreaterThan(0);
    expect(stations[0]?.StationUID).toMatch(/^TRTC-/);
    expect(stations[0]?.StationName.Zh_tw).toEqual(expect.any(String));
  });

  it('metro.liveBoard returns Kaohsiung Metro arrivals', async () => {
    const board = await tdx.metro.liveBoard('KRTC');
    expect(Array.isArray(board)).toBe(true);
    if (board.length) expect(board[0]).toHaveProperty('ServiceStatus');
  });

  it('metro.odFare returns the fare between two stations', async () => {
    const fares = await tdx.metro.odFare('TRTC', {
      filter: [`OriginStationID eq 'BL12'`, `DestinationStationID eq 'BL01'`],
    });
    expect(fares).toHaveLength(1);
    expect(fares[0]?.Fares.some((f) => f.TicketType === 1 && f.FareClass === 1)).toBe(true);
  });
});

describe.skipIf(!hasCredentials)('live TDX API: THSR', () => {
  let tdx: TdxClient;

  beforeAll(() => {
    tdx = new TdxClient({
      clientId: clientId ?? '',
      clientSecret: clientSecret ?? '',
      requestsPerSecond: 2,
    });
  });

  it('thsr.stations returns the 12 stations', async () => {
    const stations = await tdx.thsr.stations();
    expect(stations.map((s) => s.StationID)).toContain('1000');
    expect(stations.length).toBeGreaterThanOrEqual(12);
  });

  it("thsr.timetable returns tomorrow's Taipei → Zuoying trains", async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const trains = await tdx.thsr.timetable('1000', '1070', tomorrow);
    expect(trains.length).toBeGreaterThan(0);
    expect(trains[0]?.TrainDate).toBe(trainDate(tomorrow));
    expect(trains[0]?.OriginStopTime.DepartureTime).toMatch(/^\d{2}:\d{2}/);
  });

  it('thsr.odFare returns standard, business and non-reserved fares', async () => {
    const [od] = await tdx.thsr.odFare('1000', '1070');
    const cabins = new Set(od?.Fares.map((f) => f.CabinClass));
    expect([...cabins].sort()).toEqual([1, 2, 3]);
  });

  it('thsr.availableSeats returns the seat board object', async () => {
    const board = await tdx.thsr.availableSeats('1000');
    expect(Array.isArray(board.AvailableSeats)).toBe(true);
  });

  it('thsr.alerts returns at least the status record', async () => {
    const alerts = await tdx.thsr.alerts();
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0]).toHaveProperty('Title');
  });
});

describe.skipIf(!hasCredentials)('live TDX API: 0.4.0 bus and metro additions', () => {
  let tdx: TdxClient;

  beforeAll(() => {
    tdx = new TdxClient({
      clientId: clientId ?? '',
      clientSecret: clientSecret ?? '',
      requestsPerSecond: 2,
    });
  });

  it('bus.stops returns Taipei stops', async () => {
    const stops = await tdx.bus.stops('Taipei', { top: 2 });
    expect(stops).toHaveLength(2);
    expect(stops[0]?.StopUID).toMatch(/^TPE/);
  });

  it('bus.positions returns only route 307 vehicles', async () => {
    const positions = await tdx.bus.positions('Taipei', '307');
    expect(positions.every((p) => p.RouteName?.Zh_tw === '307')).toBe(true);
  });

  it('bus.interCity returns route 1610, its ETA and positions', async () => {
    const routes = await tdx.bus.interCity.routes('1610');
    expect(routes.map((r) => r.RouteName.Zh_tw)).toEqual(['1610']);
    const eta = await tdx.bus.interCity.eta('1610');
    expect(eta.every((e) => e.RouteName?.Zh_tw === '1610')).toBe(true);
    const positions = await tdx.bus.interCity.positions('1610');
    expect(Array.isArray(positions)).toBe(true);
  });

  it('metro.alerts returns the TRTC alert wrapper', async () => {
    const result = await tdx.metro.alerts('TRTC');
    expect(result.AuthorityCode).toBe('TRTC');
    expect(result.Alerts.length).toBeGreaterThan(0);
  });
});

describe.skipIf(!hasCredentials)('live TDX API: TRA', () => {
  let tdx: TdxClient;

  beforeAll(() => {
    tdx = new TdxClient({
      clientId: clientId ?? '',
      clientSecret: clientSecret ?? '',
      requestsPerSecond: 2,
    });
  });

  it('tra.stations returns 臺北 and 高雄', async () => {
    const result = await tdx.tra.stations();
    const ids = result.Stations.map((s) => s.StationID);
    expect(ids).toContain('1000');
    expect(ids).toContain('4400');
  });

  it("tra.timetable and tra.trainLiveBoard follow tomorrow's 臺北 → 高雄 trains", async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const result = await tdx.tra.timetable('1000', '4400', tomorrow);
    expect(result.TrainDate).toBe(trainDate(tomorrow));
    const trains = result.TrainTimetables ?? [];
    expect(trains.length).toBeGreaterThan(0);
    expect(trains[0]?.StopTimes.map((s) => s.StationID)).toEqual(['1000', '4400']);

    const live = await tdx.tra.trainLiveBoard(trains[0]?.TrainInfo.TrainNo ?? '');
    expect(Array.isArray(live.TrainLiveBoards)).toBe(true);
  });

  it('tra.odFare returns fares per train type', async () => {
    const result = await tdx.tra.odFare('1000', '4400');
    expect(result.ODFares.length).toBeGreaterThan(0);
    expect(result.ODFares[0]?.Fares[0]).toHaveProperty('Price');
  });

  it('tra.liveBoard and tra.alerts return their wrappers', async () => {
    const board = await tdx.tra.liveBoard('1000');
    expect(Array.isArray(board.StationLiveBoards)).toBe(true);
    const alerts = await tdx.tra.alerts();
    expect(alerts.Alerts.length).toBeGreaterThan(0);
  });
});

describe.skipIf(!hasCredentials)('live TDX API: parking', () => {
  let tdx: TdxClient;

  beforeAll(() => {
    tdx = new TdxClient({
      clientId: clientId ?? '',
      clientSecret: clientSecret ?? '',
      requestsPerSecond: 2,
    });
  });

  it('parking.carParks and availability return Taipei car parks that partly join', async () => {
    const carParks = await tdx.parking.carParks('Taipei');
    const availability = await tdx.parking.availability('Taipei');
    expect(carParks.CarParks.length).toBeGreaterThan(0);
    expect(availability.ParkingAvailabilities.length).toBeGreaterThan(0);
    const ids = new Set(carParks.CarParks.map((c) => c.CarParkID));
    expect(availability.ParkingAvailabilities.some((a) => ids.has(a.CarParkID))).toBe(true);
  });

  it('parking.segments and segmentAvailability return Taipei on-street data', async () => {
    const segments = await tdx.parking.segments('Taipei', { top: 2 });
    expect(segments.ParkingSegments).toHaveLength(2);
    const live = await tdx.parking.segmentAvailability('Taipei', { top: 2 });
    expect(live.CurbParkingSegmentAvailabilities[0]).toHaveProperty('AvailableSpaces');
  });

  it('returns an empty list for a city without data', async () => {
    const result = await tdx.parking.carParks('NewTaipei');
    expect(result.CarParks).toEqual([]);
  });
});

describe.skipIf(hasCredentials)('live TDX API (skipped)', () => {
  it.skip('set TDX_CLIENT_ID and TDX_CLIENT_SECRET in .env to run the live tests', () => {});
});
