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

  it('caches city stops and stations as static, bus positions and metro alerts as real-time', async () => {
    const lists = clientWithResponse([], { cache: true });
    const fetchLists = async () => {
      await lists.tdx.bus.stops('Taipei');
      await lists.tdx.bus.stations('Taipei', { nearby: { lat: 25, lon: 121.5, meters: 300 } });
      await lists.tdx.bus.positions('Taipei', '307');
      await lists.tdx.bus.interCity.routes('1610');
      await lists.tdx.bus.interCity.stations();
      await lists.tdx.bus.schedule('Taipei', '307');
      await lists.tdx.bus.interCity.positions('1610');
      await lists.tdx.bus.alerts('Taipei');
    };
    await fetchLists();
    vi.advanceTimersByTime(15_000);
    await fetchLists();
    expect(lists.apiUrls).toHaveLength(11); // the positions and alerts requests repeat

    const alerts = clientWithResponse({ AuthorityCode: 'TRTC', Alerts: [] }, { cache: true });
    await alerts.tdx.metro.alerts('TRTC');
    await alerts.tdx.metro.alerts('TRTC');
    vi.advanceTimersByTime(15_000);
    await alerts.tdx.metro.alerts('TRTC');
    expect(alerts.apiUrls).toHaveLength(2);
  });

  it('caches TRA stations, timetables and fares as static, live boards and alerts as real-time', async () => {
    const { tdx, apiUrls } = clientWithResponse({}, { cache: true });
    const fetchAll = async () => {
      await tdx.tra.stations();
      await tdx.tra.timetable('1000', '4400', '2026-10-22');
      await tdx.tra.odFare('1000', '4400');
      await tdx.tra.liveBoard('1000');
      await tdx.tra.trainLiveBoard('103');
      await tdx.tra.alerts();
    };
    await fetchAll();
    vi.advanceTimersByTime(15_000);
    await fetchAll();

    expect(apiUrls).toHaveLength(9); // only the three real-time requests repeat
  });

  it('caches the rail leftovers and the rail and AFR resources as static, seat status and AFR news as real-time', async () => {
    const lists = clientWithResponse([], { cache: true });
    const objects = clientWithResponse({}, { cache: true });
    const fetchAll = async () => {
      await lists.tdx.metro.network('TRTC');
      await lists.tdx.metro.shapes('TRTC');
      await lists.tdx.metro.transferStations('TRTC_NTMC');
      await lists.tdx.thsr.dailyTrainInfo('2026-10-22');
      await lists.tdx.thsr.stationsOfLine();
      await lists.tdx.rail.operators();
      await lists.tdx.rail.odDistance('TRTC_NTMC');
      await lists.tdx.rail.s2sDistance('THSR');
      await objects.tdx.metro.stationPlatforms('KLRT');
      await objects.tdx.metro.stoppingPatterns('TYMC');
      await objects.tdx.thsr.legSeatStatus('2026-10-22');
      await objects.tdx.thsr.odSeatStatus('2026-10-22');
      await objects.tdx.thsr.freeSeatingCars('2026-10-22');
      await objects.tdx.tra.timetableInclusive('1000', '1020', '2026-10-22');
      await objects.tdx.tra.specificTimetable();
      await objects.tdx.tra.lineNetwork();
      await objects.tdx.tra.stationTransfers();
      await objects.tdx.tra.operators();
      await objects.tdx.rail.odFare('TRA', '臺北', '板橋');
      await objects.tdx.afr.stations();
      await objects.tdx.afr.generalTimetable();
      await objects.tdx.afr.odFare('360', '378');
      await objects.tdx.afr.news();
    };
    await fetchAll();
    vi.advanceTimersByTime(15_000);
    await fetchAll();

    expect(lists.apiUrls).toHaveLength(8); // all static
    expect(objects.apiUrls).toHaveLength(18); // 15 calls + the 3 real-time ones repeated
  });

  it('caches the rail extras: timetables, station info and reference lists as static, news, positions and all-station boards as real-time', async () => {
    const lists = clientWithResponse([], { cache: true });
    const objects = clientWithResponse({}, { cache: true });
    const fetchAll = async () => {
      await lists.tdx.metro.stationExits('TRTC');
      await lists.tdx.metro.routes('TRTC');
      await lists.tdx.metro.frequency('TRTC');
      await lists.tdx.metro.stationTimetable('TRTC');
      await lists.tdx.thsr.generalTimetable();
      await lists.tdx.thsr.dailyTimetable('2026-10-22');
      await lists.tdx.thsr.stationExits();
      await lists.tdx.thsr.news();
      await objects.tdx.metro.stationTransfers('TRTC');
      await objects.tdx.metro.news('TRTC');
      await objects.tdx.metro.livePosition('KLRT');
      await objects.tdx.thsr.trainDates();
      await objects.tdx.thsr.availableSeats();
      await objects.tdx.tra.generalTimetable();
      await objects.tdx.tra.dailyTimetable('2026-10-22');
      await objects.tdx.tra.stationTimetable('1000');
      await objects.tdx.tra.trainDates();
      await objects.tdx.tra.lines();
      await objects.tdx.tra.trainTypes();
      await objects.tdx.tra.stationExits();
      await objects.tdx.tra.news();
      await objects.tdx.tra.liveBoard();
      await objects.tdx.tra.trainLiveBoard();
    };
    await fetchAll();
    vi.advanceTimersByTime(15_000);
    await fetchAll();

    expect(lists.apiUrls).toHaveLength(9); // 8 calls + the news request repeated
    expect(objects.apiUrls).toHaveLength(21); // 15 calls + the 6 real-time ones repeated
  });

  it('caches parking car parks and segments as static, availability as real-time', async () => {
    const { tdx, apiUrls } = clientWithResponse({}, { cache: true });
    const fetchAll = async () => {
      await tdx.parking.carParks('Taipei');
      await tdx.parking.availability('Taipei');
      await tdx.parking.segments('Taipei');
      await tdx.parking.segmentAvailability('Taipei');
    };
    await fetchAll();
    vi.advanceTimersByTime(15_000);
    await fetchAll();

    expect(apiUrls).toHaveLength(6); // only the two availability requests repeat
  });

  it('caches EV stations, points, connectors and rates as static, live status as real-time', async () => {
    const { tdx, apiUrls } = clientWithResponse({}, { cache: true });
    const fetchAll = async () => {
      await tdx.ev.stations('Taipei');
      await tdx.ev.chargingPoints('Taipei');
      await tdx.ev.connectors('Taipei');
      await tdx.ev.liveStatus('Taipei');
      await tdx.ev.chargingRates('Taipei');
      await tdx.ev.freeway.liveStatus();
    };
    await fetchAll();
    vi.advanceTimersByTime(15_000);
    await fetchAll();

    expect(apiUrls).toHaveLength(8); // only the two live-status requests repeat
  });

  it('caches airports and airlines as static, FIDS boards as real-time', async () => {
    // Two clients: list endpoints need an array body, single-object endpoints an object.
    const lists = clientWithResponse([], { cache: true });
    const objects = clientWithResponse({}, { cache: true });
    const fetchAll = async () => {
      await lists.tdx.air.airports();
      await lists.tdx.air.airlines();
      await lists.tdx.air.departures('TSA');
      await lists.tdx.air.arrivals('TSA');
      await lists.tdx.air.flights('100');
      await lists.tdx.air.boards('KHH');
      await lists.tdx.air.metar('TPE');
      await lists.tdx.air.generalSchedule('Domestic');
      await lists.tdx.air.dailySchedule('AE');
      await lists.tdx.air.routeFares('AE');
      await lists.tdx.air.seatAvailability('AE', 'TSA-KNH', '2026-10-22', '1281');
      await lists.tdx.air.news();
      await objects.tdx.air.airport('TPE');
      await objects.tdx.air.airline('CI');
    };
    await fetchAll();
    vi.advanceTimersByTime(15_000);
    await fetchAll();

    expect(lists.apiUrls).toHaveLength(19); // 12 calls + the 7 real-time ones repeated
    expect(objects.apiUrls).toHaveLength(2);
  });

  it('caches traffic sections, scales, cameras, detectors, eTag pairs and authorities as static, live data and events as real-time', async () => {
    const { tdx, apiUrls } = clientWithResponse({}, { cache: true });
    const fetchAll = async () => {
      await tdx.traffic.sections('Taipei');
      await tdx.traffic.liveTraffic('Taipei');
      await tdx.traffic.congestionLevels('Taipei');
      await tdx.traffic.cctvs('Taipei');
      await tdx.traffic.vds('Taipei');
      await tdx.traffic.vdLive('Taipei');
      await tdx.traffic.etagPairs('NewTaipei');
      await tdx.traffic.etagPairLive('NewTaipei');
      await tdx.traffic.news('Taipei');
      await tdx.traffic.events('Taipei');
      await tdx.traffic.liveEvents('Taipei');
      await tdx.traffic.authorities();
      await tdx.traffic.cms('Taipei');
      await tdx.traffic.cmsLive('Taipei');
      await tdx.traffic.etags('NewTaipei');
      await tdx.traffic.sectionLinks('Taipei');
      await tdx.traffic.sectionShapes('Taipei');
      await tdx.traffic.freeway.liveTraffic();
      await tdx.traffic.highway.sections('0001');
    };
    await fetchAll();
    vi.advanceTimersByTime(15_000);
    await fetchAll();

    expect(apiUrls).toHaveLength(27); // 19 calls + the 8 real-time ones repeated
  });

  it('caches ship ports, routes, fares, schedules and authorities as static, boards, positions, seats, alerts and news as real-time', async () => {
    const objects = clientWithResponse({}, { cache: true });
    const lists = clientWithResponse([], { cache: true });
    const fetchAll = async () => {
      await objects.tdx.ship.ports();
      await objects.tdx.ship.routes();
      await objects.tdx.ship.operators();
      await objects.tdx.ship.vessels();
      await objects.tdx.ship.stopsOfRoute();
      await objects.tdx.ship.odFare();
      await objects.tdx.ship.generalSchedule('FGGI');
      await objects.tdx.ship.dailySchedule('FGGI');
      await objects.tdx.ship.liveBoard();
      await objects.tdx.ship.livePosition();
      await objects.tdx.ship.seatAvailability();
      await objects.tdx.ship.alerts();
      await objects.tdx.ship.news();
      await objects.tdx.ship.authorities();
      await objects.tdx.ship.domestic.routes('PenghuCounty');
      await objects.tdx.ship.domestic.liveBoard('LienchiangCounty');
      await lists.tdx.ship.odFareBetween('TWKEL', 'TW007');
    };
    await fetchAll();
    vi.advanceTimersByTime(15_000);
    await fetchAll();

    expect(objects.apiUrls).toHaveLength(22); // 16 calls + the 6 real-time ones repeated
    expect(lists.apiUrls).toHaveLength(1);
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
