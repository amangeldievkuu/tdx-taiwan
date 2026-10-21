import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
  type ThsrAlert,
  type ThsrAvailableSeat,
  type ThsrAvailableSeats,
  type ThsrDailyTimetable,
  type ThsrGeneralTimetable,
  type ThsrNews,
  type ThsrODFare,
  type ThsrODTimetable,
  type ThsrStation,
  type ThsrStationExit,
  type ThsrStationTimetable,
  type ThsrTrainDates,
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
const generalFixture = loadFixture('thsr-general-timetable.json') as ThsrGeneralTimetable[];
const dailyFixture = loadFixture('thsr-daily-timetable.json') as ThsrDailyTimetable[];
const stationTimetableFixture = loadFixture(
  'thsr-station-timetable.json',
) as ThsrStationTimetable[];
const trainDatesFixture = loadFixture('thsr-train-dates.json') as ThsrTrainDates;
const newsFixture = loadFixture('thsr-news.json') as ThsrNews[];
const exitsFixture = loadFixture('thsr-station-exit.json') as ThsrStationExit[];

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

describe('tdx.thsr timetables, train dates, news and exits', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('requests each endpoint as JSON, defaulting dates to today in Taiwan', async () => {
    vi.useFakeTimers({ now: Date.parse('2026-10-21T16:30:00Z') }); // 2026-10-22 in Taipei
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.thsr.generalTimetable();
    await tdx.thsr.generalTimetable('0108', { top: 1 });
    await tdx.thsr.dailyTimetable();
    await tdx.thsr.dailyTimetable('2026-10-25');
    await tdx.thsr.trainTimetable('0803');
    await tdx.thsr.stationTimetable('1000', new Date('2026-10-24T03:00:00Z'));
    await tdx.thsr.news();
    await tdx.thsr.stationExits();

    expect(apiUrls).toEqual(
      [
        '/GeneralTimetable',
        '/GeneralTimetable/TrainNo/0108?$top=1',
        '/DailyTimetable/TrainDate/2026-10-22',
        '/DailyTimetable/TrainDate/2026-10-25',
        '/DailyTimetable/TrainNo/0803/TrainDate/2026-10-22',
        '/DailyTimetable/Station/1000/2026-10-24',
        '/News',
        '/StationExit',
      ].map((p) => `${API}/v2/Rail/THSR${p}${p.includes('?') ? '&' : '?'}$format=JSON`),
    );
  });

  it('requests the object endpoints and the all-station seat board', async () => {
    const { tdx, apiUrls } = clientWithResponse({});

    await tdx.thsr.trainDates();
    await tdx.thsr.availableSeats();
    await tdx.thsr.availableSeats({ top: 3 });
    await tdx.thsr.availableSeats('1000');

    expect(apiUrls).toEqual([
      `${API}/v2/Rail/THSR/DailyTimetable/TrainDates?$format=JSON`,
      `${API}/v2/Rail/THSR/AvailableSeatStatusList?$format=JSON`,
      `${API}/v2/Rail/THSR/AvailableSeatStatusList?$top=3&$format=JSON`,
      `${API}/v2/Rail/THSR/AvailableSeatStatusList/1000?$format=JSON`,
    ]);
    expect(() => tdx.thsr.generalTimetable('')).toThrow(TypeError);
    expect(() => tdx.thsr.trainTimetable(' ')).toThrow(TypeError);
    expect(() => tdx.thsr.stationTimetable('1000', '2026/10/22')).toThrow(TypeError);
  });

  it('parses the general and daily timetables', async () => {
    const general = await clientWithResponse(generalFixture).tdx.thsr.generalTimetable('0108');
    const daily = await clientWithResponse(dailyFixture).tdx.thsr.dailyTimetable('2026-10-22');
    expectTypeOf(general).toEqualTypeOf<ThsrGeneralTimetable[]>();
    expectTypeOf(daily).toEqualTypeOf<ThsrDailyTimetable[]>();

    const g = general[0];
    expect([
      g?.EffectiveDate,
      g?.ExpiringDate,
      g?.GeneralTimetable.GeneralTrainInfo.TrainNo,
    ]).toEqual(['2026-10-16', '', '0108']);
    expect(g?.GeneralTimetable.ServiceDay).toEqual({
      Monday: 1,
      Tuesday: 1,
      Wednesday: 1,
      Thursday: 1,
      Friday: 1,
      Saturday: 1,
      Sunday: 1,
    });
    expect(
      g?.GeneralTimetable.StopTimes.slice(0, 2).map((s) => [s.StationID, s.DepartureTime]),
    ).toEqual([
      ['1070', '07:55'],
      ['1040', '08:39'],
    ]);
    expect(daily[0]?.TrainDate).toBe('2026-10-22');
    expect(daily[0]?.DailyTrainInfo.StartingStationName?.Ja).toBeNull();
  });

  it('parses station timetables, train dates, news and exits', async () => {
    const station =
      await clientWithResponse(stationTimetableFixture).tdx.thsr.stationTimetable('1000');
    const dates = await clientWithResponse(trainDatesFixture).tdx.thsr.trainDates();
    const news = await clientWithResponse(newsFixture).tdx.thsr.news();
    const exits = await clientWithResponse(exitsFixture).tdx.thsr.stationExits();
    expectTypeOf(station).toEqualTypeOf<ThsrStationTimetable[]>();
    expectTypeOf(dates).toEqualTypeOf<ThsrTrainDates>();
    expectTypeOf(news).toEqualTypeOf<ThsrNews[]>();
    expectTypeOf(exits).toEqualTypeOf<ThsrStationExit[]>();

    expect(station.map((s) => [s.TrainNo, s.Direction, s.DepartureTime])).toEqual([
      ['0803', 0, '06:26'],
      ['0203', 0, '06:30'],
    ]);
    expect([dates.StartDate, dates.EndDate, dates.TrainDates.length]).toEqual([
      '2026-10-21',
      '2026-11-18',
      29,
    ]);
    expect(news[0]?.NewsCategory).toBe('營運資訊');
    expect(news[0]?.Description).toMatch(/^<style/);
    expect(exits[0]).toMatchObject({ StationID: '0990', ExitID: 'North Exit', Stair: true });
  });
});
