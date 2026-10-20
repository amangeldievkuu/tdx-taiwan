import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clientWithResponse, loadFixture } from '../helpers.js';

const stations = loadFixture('bike-station-taipei.json');

describe('TdxClient response cache', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: Date.parse('2026-10-20T00:00:00Z') });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('is off by default', async () => {
    const { tdx, apiUrls } = clientWithResponse(stations);

    await tdx.bike.stations('Taipei');
    await tdx.bike.stations('Taipei');

    expect(apiUrls).toHaveLength(2);
  });

  it('caches static data (stations, routes, stops, lines, timetables, fares) for an hour by default', async () => {
    const { tdx, apiUrls } = clientWithResponse(stations, { cache: true });

    await tdx.bike.stations('Taipei');
    await tdx.bus.routes('Taipei', '307');
    await tdx.bus.stopsOfRoute('Taipei', '307');
    await tdx.metro.stations('TRTC');
    await tdx.metro.lines('TRTC');
    await tdx.metro.stationsOfLine('TRTC');
    await tdx.metro.firstLastTimetable('TRTC');
    await tdx.metro.odFare('TRTC');
    vi.advanceTimersByTime(60 * 60 * 1000 - 1);
    await tdx.bike.stations('Taipei');
    await tdx.bus.routes('Taipei', '307');
    await tdx.bus.stopsOfRoute('Taipei', '307');
    await tdx.metro.stations('TRTC');
    await tdx.metro.lines('TRTC');
    await tdx.metro.stationsOfLine('TRTC');
    await tdx.metro.firstLastTimetable('TRTC');
    await tdx.metro.odFare('TRTC');
    expect(apiUrls).toHaveLength(8);

    vi.advanceTimersByTime(1);
    await tdx.bike.stations('Taipei');
    expect(apiUrls).toHaveLength(9);
  });

  it('caches real-time data (availability, ETA, live board) for 15 seconds by default', async () => {
    const { tdx, apiUrls } = clientWithResponse([], { cache: true });

    await tdx.bike.availability('Taipei');
    await tdx.bus.eta('Taipei', '307');
    await tdx.metro.liveBoard('TRTC');
    vi.advanceTimersByTime(14_999);
    await tdx.bike.availability('Taipei');
    await tdx.bus.eta('Taipei', '307');
    await tdx.metro.liveBoard('TRTC');
    expect(apiUrls).toHaveLength(3);

    vi.advanceTimersByTime(1);
    await tdx.bike.availability('Taipei');
    await tdx.bus.eta('Taipei', '307');
    await tdx.metro.liveBoard('TRTC');
    expect(apiUrls).toHaveLength(6);
  });

  it('caches THSR stations, timetables and fares as static, seats and alerts as real-time', async () => {
    const lists = clientWithResponse([], { cache: true });
    const fetchLists = async () => {
      await lists.tdx.thsr.stations();
      await lists.tdx.thsr.timetable('1000', '1070', '2026-10-21');
      await lists.tdx.thsr.odFare('1000', '1070');
      await lists.tdx.thsr.alerts();
    };
    await fetchLists();
    vi.advanceTimersByTime(15_000);
    await fetchLists();
    expect(lists.apiUrls).toHaveLength(5); // only alerts were fetched again

    const seats = clientWithResponse({ UpdateTime: 'now', AvailableSeats: [] }, { cache: true });
    await seats.tdx.thsr.availableSeats('1000');
    await seats.tdx.thsr.availableSeats('1000');
    expect(seats.apiUrls).toHaveLength(1);
    vi.advanceTimersByTime(15_000);
    await seats.tdx.thsr.availableSeats('1000');
    expect(seats.apiUrls).toHaveLength(2);
  });

  it('caches city stops as static, bus positions and metro alerts as real-time', async () => {
    const lists = clientWithResponse([], { cache: true });
    const fetchLists = async () => {
      await lists.tdx.bus.stops('Taipei');
      await lists.tdx.bus.positions('Taipei', '307');
      await lists.tdx.bus.interCity.routes('1610');
      await lists.tdx.bus.interCity.positions('1610');
    };
    await fetchLists();
    vi.advanceTimersByTime(15_000);
    await fetchLists();
    expect(lists.apiUrls).toHaveLength(6); // only the two position requests repeat

    const alerts = clientWithResponse({ AuthorityCode: 'TRTC', Alerts: [] }, { cache: true });
    await alerts.tdx.metro.alerts('TRTC');
    await alerts.tdx.metro.alerts('TRTC');
    vi.advanceTimersByTime(15_000);
    await alerts.tdx.metro.alerts('TRTC');
    expect(alerts.apiUrls).toHaveLength(2);
  });

  it('returns copies of cached objects too', async () => {
    const { tdx } = clientWithResponse(
      { UpdateTime: 'now', AvailableSeats: [{ TrainNo: '0803' }] },
      { cache: true },
    );

    const first = await tdx.thsr.availableSeats('1000');
    first.AvailableSeats.length = 0;

    const second = await tdx.thsr.availableSeats('1000');
    expect(second.AvailableSeats).toHaveLength(1);
  });

  it('uses custom TTLs', async () => {
    const { tdx, apiUrls } = clientWithResponse([], {
      cache: { staticTtlMs: 1000, realtimeTtlMs: 100 },
    });

    await tdx.bike.stations('Taipei');
    await tdx.bike.availability('Taipei');
    vi.advanceTimersByTime(100);
    await tdx.bike.stations('Taipei');
    await tdx.bike.availability('Taipei');
    expect(apiUrls).toHaveLength(3);

    vi.advanceTimersByTime(900);
    await tdx.bike.stations('Taipei');
    expect(apiUrls).toHaveLength(4);
  });

  it('keys entries by the full URL, including the query', async () => {
    const { tdx, apiUrls } = clientWithResponse([], { cache: true });

    await tdx.bike.stations('Taipei');
    await tdx.bike.stations('Taipei', { top: 1 });
    await tdx.bike.stations('NewTaipei');
    await tdx.bike.stations('Taipei', { top: 1 });

    expect(apiUrls).toHaveLength(3);
  });

  it('shares one request between identical concurrent calls', async () => {
    const { tdx, apiUrls } = clientWithResponse(stations, { cache: true });

    const results = await Promise.all([
      tdx.bike.stations('Taipei'),
      tdx.bike.stations('Taipei'),
      tdx.bike.stations('Taipei'),
    ]);

    expect(apiUrls).toHaveLength(1);
    expect(results[1]).toEqual(stations);
  });

  it('returns copies, so mutating a result does not corrupt the cache', async () => {
    const { tdx } = clientWithResponse(stations, { cache: true });

    const first = await tdx.bike.stations('Taipei');
    first.length = 0;

    await expect(tdx.bike.stations('Taipei')).resolves.toHaveLength(3);
  });

  it('does not cache failures', async () => {
    const { tdx, apiUrls } = clientWithResponse({ not: 'an array' }, { cache: true });

    await expect(tdx.bike.stations('Taipei')).rejects.toThrow(/Expected a JSON array/);
    await expect(tdx.bike.stations('Taipei')).rejects.toThrow(/Expected a JSON array/);

    expect(apiUrls).toHaveLength(2);
  });

  it('clearCache() empties the cache', async () => {
    const { tdx, apiUrls } = clientWithResponse([], { cache: true });

    await tdx.bike.stations('Taipei');
    tdx.clearCache();
    await tdx.bike.stations('Taipei');

    expect(apiUrls).toHaveLength(2);
  });
});
