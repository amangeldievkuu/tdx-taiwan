import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
  type ThsrAlert,
  type ThsrAvailableSeat,
  type ThsrAvailableSeats,
  type ThsrODFare,
  type ThsrODTimetable,
  type ThsrStation,
  TdxApiError,
  query,
  trainDate,
} from '../../src/index.js';
import { API, clientWithResponse, loadFixture } from '../helpers.js';

const stationsFixture = loadFixture('thsr-station.json') as ThsrStation[];
const timetableFixture = loadFixture('thsr-timetable.json') as ThsrODTimetable[];
const fareFixture = loadFixture('thsr-od-fare.json') as ThsrODFare[];
const seatsFixture = loadFixture('thsr-available-seats.json') as ThsrAvailableSeats;
const alertFixture = loadFixture('thsr-alert.json') as ThsrAlert[];

describe('trainDate', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('passes YYYY-MM-DD strings through', () => {
    expect(trainDate('2026-10-21')).toBe('2026-10-21');
  });

  it('formats a Date as the calendar day in Taiwan (UTC+8)', () => {
    expect(trainDate(new Date('2026-10-20T15:59:59Z'))).toBe('2026-10-20');
    expect(trainDate(new Date('2026-10-20T16:00:00Z'))).toBe('2026-10-21');
  });

  it("defaults to today's date in Taiwan", () => {
    vi.useFakeTimers({ now: Date.parse('2026-10-20T16:30:00Z') });
    expect(trainDate()).toBe('2026-10-21');
  });

  it('rejects malformed or impossible dates', () => {
    for (const bad of ['2026-02-30', '2026-1-01', '20261021', '2026-10-21T00:00', '']) {
      expect(() => trainDate(bad)).toThrow(TypeError);
    }
    expect(() => trainDate(new Date('not a date'))).toThrow(TypeError);
  });
});

describe('tdx.thsr paths', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('requests each endpoint as JSON', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.thsr.stations();
    await tdx.thsr.timetable('1000', '1070', '2026-10-21');
    await tdx.thsr.odFare('1000', '1070');
    await tdx.thsr.alerts();

    expect(apiUrls).toEqual([
      `${API}/v2/Rail/THSR/Station?$format=JSON`,
      `${API}/v2/Rail/THSR/DailyTimetable/OD/1000/to/1070/2026-10-21?$format=JSON`,
      `${API}/v2/Rail/THSR/ODFare/1000/to/1070?$format=JSON`,
      `${API}/v2/Rail/THSR/AlertInfo?$format=JSON`,
    ]);
  });

  it("uses today's date in Taiwan when no date is given", async () => {
    vi.useFakeTimers({ now: Date.parse('2026-10-20T16:30:00Z') });
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.thsr.timetable('1070', '0990');
    await tdx.thsr.timetable('1070', '0990', new Date('2026-10-25T03:00:00Z'));

    expect(apiUrls).toEqual([
      `${API}/v2/Rail/THSR/DailyTimetable/OD/1070/to/0990/2026-10-21?$format=JSON`,
      `${API}/v2/Rail/THSR/DailyTimetable/OD/1070/to/0990/2026-10-25?$format=JSON`,
    ]);
  });

  it('passes OData queries through', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.thsr.timetable(
      '1000',
      '1070',
      '2026-10-21',
      query<ThsrODTimetable>().filter("OriginStopTime/DepartureTime ge '18:00'").top(3),
    );

    expect(decodeURIComponent(apiUrls[0] ?? '')).toBe(
      `${API}/v2/Rail/THSR/DailyTimetable/OD/1000/to/1070/2026-10-21` +
        `?$filter=OriginStopTime/DepartureTime ge '18:00'&$top=3&$format=JSON`,
    );
  });

  it('validates station IDs and dates', () => {
    const { tdx } = clientWithResponse([]);

    expect(() => tdx.thsr.odFare('', '1070')).toThrow(TypeError);
    expect(() => tdx.thsr.timetable('1000', ' ')).toThrow(TypeError);
    expect(() => tdx.thsr.timetable('1000', '1070', '2026/10/21')).toThrow(TypeError);
    expect(() => tdx.thsr.availableSeats('')).toThrow(TypeError);
  });
});

describe('tdx.thsr.availableSeats', () => {
  it('requests the seat board for a station and applies the query to its items', async () => {
    const { tdx, apiUrls } = clientWithResponse(seatsFixture);

    await tdx.thsr.availableSeats('1000', query<ThsrAvailableSeat>().filter('Direction eq 0'));

    expect(decodeURIComponent(apiUrls[0] ?? '')).toBe(
      `${API}/v2/Rail/THSR/AvailableSeatStatusList/1000?$filter=Direction eq 0&$format=JSON`,
    );
  });

  it('returns the wrapper object with seat statuses per stop', async () => {
    const { tdx } = clientWithResponse(seatsFixture);

    const board = await tdx.thsr.availableSeats('1000');
    expectTypeOf(board).toEqualTypeOf<ThsrAvailableSeats>();

    expect(board.UpdateTime).toEqual(expect.any(String));
    expect(board.AvailableSeats.map((s) => [s.TrainNo, s.Direction, s.DepartureTime])).toEqual([
      ['1202', 1, '08:07'],
      ['1241', 0, '16:51'],
      ['1305', 0, '08:01'],
    ]);
    expect(
      board.AvailableSeats[1]?.StopStations.map((s) => [s.StationID, s.StandardSeatStatus]),
    ).toEqual([
      ['1010', 'L'],
      ['1040', 'X'],
      ['1060', 'X'],
    ]);
  });

  it('rejects an array where an object is expected', async () => {
    const { tdx } = clientWithResponse([]);

    await expect(tdx.thsr.availableSeats('1000')).rejects.toBeInstanceOf(TdxApiError);
  });
});

describe('tdx.thsr parsing', () => {
  it('parses stations', async () => {
    const { tdx } = clientWithResponse(stationsFixture);

    const stations = await tdx.thsr.stations();
    expectTypeOf(stations).toEqualTypeOf<ThsrStation[]>();

    expect(stations.map((s) => [s.StationUID, s.StationCode, s.StationName.En])).toEqual([
      ['THSR-1000', 'TPE', 'Taipei'],
      ['THSR-1070', 'ZUY', 'Zuoying'],
    ]);
  });

  it('parses the timetable, including the empty Note', async () => {
    const { tdx } = clientWithResponse(timetableFixture);

    const trains = await tdx.thsr.timetable('1000', '1070', '2026-10-21');
    expectTypeOf(trains).toEqualTypeOf<ThsrODTimetable[]>();

    expect(
      trains.map((t) => [
        t.DailyTrainInfo.TrainNo,
        t.OriginStopTime.DepartureTime,
        t.DestinationStopTime.ArrivalTime,
      ]),
    ).toEqual([
      ['0803', '06:26', '08:40'],
      ['0203', '06:30', '08:15'],
    ]);
    expect(trains[0]?.DailyTrainInfo.Note).toEqual({});
    expect(trains[0]?.DailyTrainInfo.Direction).toBe(0);
  });

  it('parses fares by ticket type, fare class and cabin', async () => {
    const { tdx } = clientWithResponse(fareFixture);

    const [od] = await tdx.thsr.odFare('1000', '1070');
    expectTypeOf(od).toEqualTypeOf<ThsrODFare | undefined>();

    const price = (ticket: number, fare: number, cabin: number) =>
      od?.Fares.find(
        (f) => f.TicketType === ticket && f.FareClass === fare && f.CabinClass === cabin,
      )?.Price;
    expect([price(1, 1, 1), price(1, 1, 2), price(1, 1, 3), price(8, 1, 1)]).toEqual([
      1490, 2440, 1445, 1415,
    ]);
  });

  it('parses the normal-day alert', async () => {
    const { tdx } = clientWithResponse(alertFixture);

    const alerts = await tdx.thsr.alerts();
    expectTypeOf(alerts).toEqualTypeOf<ThsrAlert[]>();

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ Title: '全線營運正常(Normal)', Status: '' });
  });
});
