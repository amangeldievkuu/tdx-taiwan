import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
  type TraAlerts,
  type TraGeneralStationTimetables,
  type TraGeneralTimetables,
  type TraLines,
  type TraNewsList,
  type TraODFares,
  type TraStationLiveBoard,
  type TraStationExits,
  type TraStationFacilities,
  type TraStationLiveBoards,
  type TraStationOfLines,
  type TraStationTimetables,
  type TraStations,
  type TraTimetable,
  type TraTrainDates,
  type TraTrainLiveBoards,
  type TraTrainTypes,
  TdxApiError,
  query,
} from '../../src/index.js';
import { API, clientWithResponse, loadFixture } from '../helpers.js';

const stationsFixture = loadFixture('tra-station.json') as TraStations;
const timetableFixture = loadFixture('tra-timetable.json') as TraTimetable;
const fareFixture = loadFixture('tra-od-fare.json') as TraODFares;
const liveBoardFixture = loadFixture('tra-station-live-board.json') as TraStationLiveBoards;
const trainLiveFixture = loadFixture('tra-train-live-board.json') as TraTrainLiveBoards;
const alertFixture = loadFixture('tra-alert.json') as TraAlerts;
const generalFixture = loadFixture('tra-general-timetable.json') as TraGeneralTimetables;
const generalStationFixture = loadFixture(
  'tra-general-station-timetable.json',
) as TraGeneralStationTimetables;
const dailyFixture = loadFixture('tra-daily-timetable.json') as TraTimetable;
const stationTimetableFixture = loadFixture('tra-station-timetable.json') as TraStationTimetables;
const trainDatesFixture = loadFixture('tra-train-dates.json') as TraTrainDates;
const linesFixture = loadFixture('tra-line.json') as TraLines;
const stationsOfLineFixture = loadFixture('tra-station-of-line.json') as TraStationOfLines;
const trainTypesFixture = loadFixture('tra-train-type.json') as TraTrainTypes;
const exitsFixture = loadFixture('tra-station-exit.json') as TraStationExits;
const facilitiesFixture = loadFixture('tra-station-facility.json') as TraStationFacilities;
const newsFixture = loadFixture('tra-news.json') as TraNewsList;
const allLiveBoardsFixture = loadFixture('tra-station-live-board-all.json') as TraStationLiveBoards;

describe('tdx.tra paths', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('requests each v3 endpoint as JSON', async () => {
    const { tdx, apiUrls } = clientWithResponse({});

    await tdx.tra.stations();
    await tdx.tra.timetable('1000', '4400', '2026-10-22');
    await tdx.tra.odFare('1000', '4400');
    await tdx.tra.liveBoard('1020');
    await tdx.tra.trainLiveBoard('103');
    await tdx.tra.alerts();

    expect(apiUrls).toEqual([
      `${API}/v3/Rail/TRA/Station?$format=JSON`,
      `${API}/v3/Rail/TRA/DailyTrainTimetable/OD/1000/to/4400/2026-10-22?$format=JSON`,
      `${API}/v3/Rail/TRA/ODFare/1000/to/4400?$format=JSON`,
      `${API}/v3/Rail/TRA/StationLiveBoard/Station/1020?$format=JSON`,
      `${API}/v3/Rail/TRA/TrainLiveBoard/TrainNo/103?$format=JSON`,
      `${API}/v3/Rail/TRA/Alert?$format=JSON`,
    ]);
  });

  it("uses today's date in Taiwan when no date is given", async () => {
    vi.useFakeTimers({ now: Date.parse('2026-10-21T16:30:00Z') });
    const { tdx, apiUrls } = clientWithResponse({});

    await tdx.tra.timetable('4400', '1000');

    expect(apiUrls).toEqual([
      `${API}/v3/Rail/TRA/DailyTrainTimetable/OD/4400/to/1000/2026-10-22?$format=JSON`,
    ]);
  });

  it('applies queries to the items inside the wrapper', async () => {
    const { tdx, apiUrls } = clientWithResponse({});

    await tdx.tra.liveBoard(
      '1000',
      query<TraStationLiveBoard>().filter('DelayTime gt 0').orderBy('ScheduleDepartureTime'),
    );
    await tdx.tra.odFare('1000', '4400', { filter: 'TrainType eq 3' });

    expect(apiUrls.map((u) => decodeURIComponent(u))).toEqual([
      `${API}/v3/Rail/TRA/StationLiveBoard/Station/1000` +
        `?$filter=DelayTime gt 0&$orderby=ScheduleDepartureTime&$format=JSON`,
      `${API}/v3/Rail/TRA/ODFare/1000/to/4400?$filter=TrainType eq 3&$format=JSON`,
    ]);
  });

  it('validates station IDs, train numbers and dates', () => {
    const { tdx } = clientWithResponse({});

    expect(() => tdx.tra.odFare('', '4400')).toThrow(TypeError);
    expect(() => tdx.tra.liveBoard(' ')).toThrow(TypeError);
    expect(() => tdx.tra.trainLiveBoard('')).toThrow(TypeError);
    expect(() => tdx.tra.timetable('1000', '4400', '22/10/2026')).toThrow(TypeError);
  });

  it('rejects an array where a wrapper object is expected', async () => {
    const { tdx } = clientWithResponse([]);

    await expect(tdx.tra.stations()).rejects.toBeInstanceOf(TdxApiError);
  });
});

describe('tdx.tra parsing', () => {
  it('parses stations, with TRA names (Kr instead of Ko)', async () => {
    const { tdx } = clientWithResponse(stationsFixture);

    const result = await tdx.tra.stations();
    expectTypeOf(result).toEqualTypeOf<TraStations>();

    expect(result.AuthorityCode).toBe('TRA');
    expect(result.Stations.map((s) => [s.StationUID, s.StationName.Zh_tw, s.StationClass])).toEqual(
      [
        ['TRA-1000', '臺北', '0'],
        ['TRA-4400', '高雄', '0'],
      ],
    );
    expect(result.Stations[0]?.StationName.Kr).toBe('타이베이');
  });

  it('parses the timetable without the AuthorityCode the spec promises', async () => {
    const { tdx } = clientWithResponse(timetableFixture);

    const result = await tdx.tra.timetable('1000', '4400', '2026-10-22');
    expectTypeOf(result).toEqualTypeOf<TraTimetable>();

    expect(result.TrainDate).toBe('2026-10-22');
    expect(result.AuthorityCode).toBeUndefined();
    const trains = result.TrainTimetables ?? [];
    expect(
      trains.map((t) => [
        t.TrainInfo.TrainNo,
        t.TrainInfo.TrainTypeCode,
        t.TrainInfo.Direction,
        t.StopTimes.map((s) => [s.StationID, s.DepartureTime]),
      ]),
    ).toEqual([
      [
        '103',
        '3',
        1,
        [
          ['1000', '06:27'],
          ['4400', '11:37'],
        ],
      ],
      [
        '105',
        '3',
        1,
        [
          ['1000', '06:59'],
          ['4400', '12:15'],
        ],
      ],
    ]);
  });

  it('parses fares per train type and direction', async () => {
    const { tdx } = clientWithResponse(fareFixture);

    const result = await tdx.tra.odFare('1000', '4400');
    expectTypeOf(result).toEqualTypeOf<TraODFares>();

    // TRA lines form a ring: the same train type has a fare for each direction.
    const adult = (trainType: number, direction: number) =>
      result.ODFares.find(
        (o) => o.TrainType === trainType && o.Direction === direction,
      )?.Fares.find((f) => f.TicketType === 1 && f.FareClass === 1 && f.CabinClass === 1)?.Price;
    expect([adult(3, 1), adult(3, 0), adult(6, 1)]).toEqual([994, 1286, 640]);
    expect(result.EffectiveDate).toBe('2026-10-04');
  });

  it('parses the station live board with delays', async () => {
    const { tdx } = clientWithResponse(liveBoardFixture);

    const result = await tdx.tra.liveBoard('1020');
    expectTypeOf(result).toEqualTypeOf<TraStationLiveBoards>();

    expect(
      result.StationLiveBoards.map((b) => [
        b.TrainNo,
        b.EndingStationName.Zh_tw,
        b.ScheduleDepartureTime,
        b.DelayTime,
        b.RunningStatus,
      ]),
    ).toEqual([
      ['270', '花蓮', '09:47:00', 4, 1],
      ['193', '彰化', '09:47:30', 0, 0],
    ]);
  });

  it('parses the train live board', async () => {
    const { tdx } = clientWithResponse(trainLiveFixture);

    const result = await tdx.tra.trainLiveBoard('103');
    expectTypeOf(result).toEqualTypeOf<TraTrainLiveBoards>();

    expect(result.TrainLiveBoards[0]).toMatchObject({
      TrainNo: '103',
      StationName: { Zh_tw: '社頭' },
      TrainStationStatus: 2,
      DelayTime: 1,
    });
  });

  it('parses the normal-day alert, which lacks AlertID and Description', async () => {
    const { tdx } = clientWithResponse(alertFixture);

    const result = await tdx.tra.alerts();
    expectTypeOf(result).toEqualTypeOf<TraAlerts>();

    expect(result.Alerts).toEqual([
      { Title: '全線營運正常', Status: 1, UpdateTime: '2026-10-16T22:07:00+08:00' },
    ]);
  });
});

describe('tdx.tra timetables, reference lists, station info and news', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('requests each endpoint as JSON, defaulting dates to today in Taiwan', async () => {
    vi.useFakeTimers({ now: Date.parse('2026-10-21T16:30:00Z') }); // 2026-10-22 in Taipei
    const { tdx, apiUrls } = clientWithResponse({});

    await tdx.tra.generalTimetable();
    await tdx.tra.generalTimetable('1004', { top: 1 });
    await tdx.tra.generalStationTimetable();
    await tdx.tra.generalStationTimetable('1000');
    await tdx.tra.dailyTimetable();
    await tdx.tra.dailyTimetable('2026-10-25');
    await tdx.tra.trainTimetable('103');
    await tdx.tra.stationTimetable('1000');
    await tdx.tra.dailyStationTimetable(new Date('2026-10-24T03:00:00Z'));
    await tdx.tra.trainDates();
    await tdx.tra.lines();
    await tdx.tra.stationsOfLine();
    await tdx.tra.trainTypes();
    await tdx.tra.stationExits();
    await tdx.tra.stationFacilities();
    await tdx.tra.news();
    await tdx.tra.liveBoard();
    await tdx.tra.liveBoard({ top: 2 });
    await tdx.tra.trainLiveBoard();
    await tdx.tra.trainLiveBoard('103');

    expect(apiUrls).toEqual(
      [
        '/GeneralTrainTimetable',
        '/GeneralTrainTimetable/TrainNo/1004?$top=1',
        '/GeneralStationTimetable',
        '/GeneralStationTimetable/Station/1000',
        '/DailyTrainTimetable/TrainDate/2026-10-22',
        '/DailyTrainTimetable/TrainDate/2026-10-25',
        '/DailyTrainTimetable/Today/TrainNo/103',
        '/DailyStationTimetable/Today/Station/1000',
        '/DailyStationTimetable/TrainDate/2026-10-24',
        '/DailyTrainTimetable/TrainDates',
        '/Line',
        '/StationOfLine',
        '/TrainType',
        '/StationExit',
        '/StationFacility',
        '/News',
        '/StationLiveBoard',
        '/StationLiveBoard?$top=2',
        '/TrainLiveBoard',
        '/TrainLiveBoard/TrainNo/103',
      ].map((p) => `${API}/v3/Rail/TRA${p}${p.includes('?') ? '&' : '?'}$format=JSON`),
    );
    expect(() => tdx.tra.generalTimetable('')).toThrow(TypeError);
    expect(() => tdx.tra.trainTimetable(' ')).toThrow(TypeError);
    expect(() => tdx.tra.dailyTimetable('2026/10/22')).toThrow(TypeError);
    await expect(clientWithResponse([]).tdx.tra.lines()).rejects.toBeInstanceOf(TdxApiError);
  });

  it('parses the general train and station timetables', async () => {
    const general = await clientWithResponse(generalFixture).tdx.tra.generalTimetable('1004');
    const station =
      await clientWithResponse(generalStationFixture).tdx.tra.generalStationTimetable('1000');
    expectTypeOf(general).toEqualTypeOf<TraGeneralTimetables>();
    expectTypeOf(station).toEqualTypeOf<TraGeneralStationTimetables>();

    expect(general.EffectiveDate).toBe('2026-07-01T00:00:00+08:00');
    expect(general.SrcVersion).toBe('');
    const train = general.TrainTimetables[0];
    expect(train?.TrainInfo.TrainNo).toBe('1004');
    expect(train?.ServiceDay).toMatchObject({ Saturday: 1, Sunday: 1, Monday: 0, TyphoonDay: 0 });
    expect(train?.StopTimes[0]).toMatchObject({ StationID: '1110', DepartureTime: '10:27' });
    const st = station.StationTimetables[0];
    expect([st?.StationID, st?.Direction, st?.ServiceDay.TyphoonDay]).toEqual(['1000', 0, false]);
    expect(st?.Timetables.map((t) => [t.TrainNo, t.DepartureTime])).toEqual([
      ['152', '00:05'],
      ['452', '00:20'],
      ['4128', '05:26'],
    ]);
  });

  it('parses the daily timetables and train dates', async () => {
    const daily = await clientWithResponse(dailyFixture).tdx.tra.dailyTimetable('2026-10-22');
    const station =
      await clientWithResponse(stationTimetableFixture).tdx.tra.stationTimetable('1000');
    const dates = await clientWithResponse(trainDatesFixture).tdx.tra.trainDates();
    expectTypeOf(daily).toEqualTypeOf<TraTimetable>();
    expectTypeOf(station).toEqualTypeOf<TraStationTimetables>();
    expectTypeOf(dates).toEqualTypeOf<TraTrainDates>();

    expect(daily.TrainDate).toBe('2026-10-22');
    expect(daily.TrainTimetables?.[0]?.TrainInfo).toMatchObject({
      TrainNo: '1006',
      TrainTypeCode: '10',
    });
    expect(station.TrainDate).toBe('2026-10-21');
    expect(
      station.StationTimetables[0]?.TimeTables.map((t) => [
        t.TrainNo,
        t.DepartureTime,
        t.SuspendedFlag,
      ]),
    ).toEqual([
      ['152', '00:05', 0],
      ['4128', '05:26', 0],
      ['1106', '05:45', 0],
    ]);
    expect([dates.StartDate, dates.EndDate, dates.TrainDates.length, dates.Count]).toEqual([
      '2026-10-20',
      '2026-12-19',
      61,
      61,
    ]);
  });

  it('parses lines, stations of line, train types, exits, facilities and news', async () => {
    const lines = await clientWithResponse(linesFixture).tdx.tra.lines();
    const stationsOfLine = await clientWithResponse(stationsOfLineFixture).tdx.tra.stationsOfLine();
    const types = await clientWithResponse(trainTypesFixture).tdx.tra.trainTypes();
    const exits = await clientWithResponse(exitsFixture).tdx.tra.stationExits();
    const facilities = await clientWithResponse(facilitiesFixture).tdx.tra.stationFacilities();
    const news = await clientWithResponse(newsFixture).tdx.tra.news();
    expectTypeOf(lines).toEqualTypeOf<TraLines>();
    expectTypeOf(stationsOfLine).toEqualTypeOf<TraStationOfLines>();
    expectTypeOf(types).toEqualTypeOf<TraTrainTypes>();
    expectTypeOf(exits).toEqualTypeOf<TraStationExits>();
    expectTypeOf(facilities).toEqualTypeOf<TraStationFacilities>();
    expectTypeOf(news).toEqualTypeOf<TraNewsList>();

    expect(lines.Lines.map((l) => [l.LineID, l.IsBranch])).toEqual([
      ['CZ', true],
      ['EL', false],
    ]);
    expect(stationsOfLine.StationOfLines[0]?.Stations.map((s) => s.StationID)).toEqual([
      '3350',
      '2260',
    ]);
    expect(types.TrainTypes.map((t) => [t.TrainTypeID, t.TrainTypeCode])).toEqual([
      ['1100', '3'],
      ['1101', '1'],
      ['1102', '3'],
    ]);
    const exit = exits.StationExits[0];
    expect([exit?.StationID, exit?.Exits[0]?.ExitID, exit?.Exits[0]?.Escalator]).toEqual([
      '0900',
      '0900-S Station (Zhongshan 1st Rd.)',
      1,
    ]);
    expect(facilities.StationFacilities[0]?.Elevators[0]?.Description).toBe('');
    expect(news.Newses[0]).toMatchObject({ Language: 1, NewsCategory: 1 });
  });

  it('parses the all-station live board', async () => {
    const { tdx } = clientWithResponse(allLiveBoardsFixture);

    const boards = await tdx.tra.liveBoard();
    expectTypeOf(boards).toEqualTypeOf<TraStationLiveBoards>();

    expect(boards.StationLiveBoards.map((b) => [b.StationID, b.TrainNo])).toEqual([
      ['1230', '2544'],
      [expect.any(String), expect.any(String)],
    ]);
  });
});
