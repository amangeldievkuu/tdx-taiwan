import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
  type TraAlerts,
  type TraODFares,
  type TraStationLiveBoard,
  type TraStationLiveBoards,
  type TraStations,
  type TraTimetable,
  type TraTrainLiveBoards,
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
