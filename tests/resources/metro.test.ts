import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  type MetroFirstLastTimetable,
  type MetroLine,
  type MetroLiveBoard,
  type MetroODFare,
  type MetroStation,
  type MetroStationOfLine,
  TdxApiError,
  odata,
  query,
} from '../../src/index.js';
import { API, clientWithResponse, loadFixture } from '../helpers.js';

const stationsFixture = loadFixture('metro-station.json') as MetroStation[];
const linesFixture = loadFixture('metro-line.json') as MetroLine[];
const stationsOfLineFixture = loadFixture('metro-station-of-line.json') as MetroStationOfLine[];
const liveBoardFixture = loadFixture('metro-live-board.json') as MetroLiveBoard[];
const firstLastFixture = loadFixture(
  'metro-first-last-timetable.json',
) as MetroFirstLastTimetable[];
const odFareFixture = loadFixture('metro-od-fare.json') as MetroODFare[];

describe('tdx.metro paths', () => {
  it('requests each endpoint for a rail system as JSON', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.metro.stations('TRTC');
    await tdx.metro.lines('KRTC');
    await tdx.metro.stationsOfLine('TYMC');
    await tdx.metro.liveBoard('KLRT');
    await tdx.metro.firstLastTimetable('TMRT');
    await tdx.metro.odFare('NTDLRT');

    expect(apiUrls).toEqual([
      `${API}/v2/Rail/Metro/Station/TRTC?$format=JSON`,
      `${API}/v2/Rail/Metro/Line/KRTC?$format=JSON`,
      `${API}/v2/Rail/Metro/StationOfLine/TYMC?$format=JSON`,
      `${API}/v2/Rail/Metro/LiveBoard/KLRT?$format=JSON`,
      `${API}/v2/Rail/Metro/FirstLastTimetable/TMRT?$format=JSON`,
      `${API}/v2/Rail/Metro/ODFare/NTDLRT?$format=JSON`,
    ]);
  });

  it('passes OData queries through', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.metro.odFare('TRTC', {
      filter: [
        `OriginStationID eq ${odata.str('BL12')}`,
        `DestinationStationID eq ${odata.str('BL01')}`,
      ],
    });
    await tdx.metro.liveBoard(
      'TRTC',
      query<MetroLiveBoard>().filter(`StationID eq 'BL12'`).orderBy('EstimateTime'),
    );

    expect(apiUrls.map((u) => decodeURIComponent(u))).toEqual([
      `${API}/v2/Rail/Metro/ODFare/TRTC` +
        `?$filter=(OriginStationID eq 'BL12') and (DestinationStationID eq 'BL01')&$format=JSON`,
      `${API}/v2/Rail/Metro/LiveBoard/TRTC` +
        `?$filter=StationID eq 'BL12'&$orderby=EstimateTime&$format=JSON`,
    ]);
  });

  it('validates the system argument', () => {
    const { tdx } = clientWithResponse([]);

    expect(() => tdx.metro.stations('')).toThrow(TypeError);
    expect(() => tdx.metro.liveBoard('  ')).toThrow(TypeError);
  });

  it('rejects a non-array response', async () => {
    const { tdx } = clientWithResponse({ Message: 'unexpected' });

    await expect(tdx.metro.lines('TRTC')).rejects.toBeInstanceOf(TdxApiError);
  });
});

describe('tdx.metro parsing', () => {
  it('parses stations, including one without an address', async () => {
    const { tdx } = clientWithResponse(stationsFixture);

    const stations = await tdx.metro.stations('TRTC');
    expectTypeOf(stations).toEqualTypeOf<MetroStation[]>();

    expect(stations[0]).toMatchObject({
      StationUID: 'TRTC-BL12',
      StationName: { Zh_tw: '台北車站', En: 'Taipei Main Station' },
      StationPosition: { PositionLat: 25.04631, PositionLon: 121.517415 },
      LocationCityCode: 'TPE',
    });
    expect(stations[1]?.StationUID).toBe('NTDLRT-V02');
    expect(stations[1]?.StationAddress).toBeUndefined();
  });

  it('parses lines, including empty section names and a missing color', async () => {
    const { tdx } = clientWithResponse(linesFixture);

    const lines = await tdx.metro.lines('TRTC');
    expectTypeOf(lines).toEqualTypeOf<MetroLine[]>();

    expect(lines.map((l) => [l.LineID, l.LineColor, l.LineSectionName.Zh_tw])).toEqual([
      ['BL', '#0a59ae', undefined],
      ['O', undefined, undefined],
      ['A', '#8246AF', '台北車站-老街溪'],
    ]);
  });

  it('parses ordered stations of each line', async () => {
    const { tdx } = clientWithResponse(stationsOfLineFixture);

    const result = await tdx.metro.stationsOfLine('KRTC');
    expectTypeOf(result).toEqualTypeOf<MetroStationOfLine[]>();

    expect(result.map((l) => l.LineID)).toEqual(['O', 'R']);
    expect(result[0]?.Stations.map((s) => [s.Sequence, s.StationID, s.StationName.Zh_tw])).toEqual([
      [1, 'O1', '哈瑪星'],
      [2, 'O2', '鹽埕埔'],
      [3, 'O4', '前金'],
    ]);
    expect(result[0]?.Stations[1]?.CumulativeDistance).toBe(1.32);
    expect(result[0]?.Stations[0]?.StationName.Ja).toBeNull();
  });

  it('parses the live board, including a passed last train', async () => {
    const { tdx } = clientWithResponse(liveBoardFixture);

    const board = await tdx.metro.liveBoard('TRTC');
    expectTypeOf(board).toEqualTypeOf<MetroLiveBoard[]>();

    expect(
      board.map((b) => [b.StationID, b.TripHeadSign, b.ServiceStatus, b.EstimateTime]),
    ).toEqual([
      ['BL22', '往亞東醫院', 0, 0],
      ['BR02', '往動物園', 0, 0],
      ['O1', '往大寮', 3, null],
    ]);
    expect(board[0]?.DestinationStationID).toBe(board[0]?.DestinationStaionID);
  });

  it('parses first and last trains', async () => {
    const { tdx } = clientWithResponse(firstLastFixture);

    const timetable = await tdx.metro.firstLastTimetable('TRTC');
    expectTypeOf(timetable).toEqualTypeOf<MetroFirstLastTimetable[]>();

    expect(
      timetable.map((t) => [t.DestinationStaionID, t.FirstTrainTime, t.LastTrainTime]),
    ).toEqual([
      ['BL01', '06:00', '00:49'],
      ['BL23', '06:00', '00:49'],
    ]);
    expect(timetable[0]?.ServiceDay).toMatchObject({ Monday: true, NationalHolidays: true });
  });

  it('parses fares, including resident-only prices', async () => {
    const { tdx } = clientWithResponse(odFareFixture);

    const fares = await tdx.metro.odFare('TRTC');
    expectTypeOf(fares).toEqualTypeOf<MetroODFare[]>();

    const [od] = fares;
    expect(od).toMatchObject({ OriginStationID: 'BL12', DestinationStationID: 'BL01' });
    expect(od?.Fares.find((f) => f.TicketType === 1 && f.FareClass === 1)?.Price).toBe(40);
    expect(od?.Fares.filter((f) => f.CitizenCode).map((f) => f.CitizenCode)).toEqual([
      'NWT',
      'TPE',
    ]);
    expect(od?.TravelTime).toBeUndefined();
  });
});
