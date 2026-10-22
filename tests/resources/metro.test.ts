import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  type MetroAlert,
  type MetroAlerts,
  type MetroFirstLastTimetable,
  type MetroFrequency,
  type MetroLine,
  type MetroLineTransfer,
  type MetroLiveBoard,
  type MetroNetwork,
  type MetroNewsList,
  type MetroODFare,
  type MetroRoute,
  type MetroS2STravelTime,
  type MetroShape,
  type MetroStation,
  type MetroStationExit,
  type MetroStationFacility,
  type MetroStationOfLine,
  type MetroStationOfRoute,
  type MetroStationPlatforms,
  type MetroStationTimetable,
  type MetroStationTransfers,
  type MetroStoppingPatterns,
  type MetroTransferStation,
  TdxApiError,
  odata,
  query,
} from '../../src/index.js';
import { API, clientWithResponse, jsonResponse, loadFixture, tokenResponse } from '../helpers.js';

const stationsFixture = loadFixture('metro-station.json') as MetroStation[];
const linesFixture = loadFixture('metro-line.json') as MetroLine[];
const stationsOfLineFixture = loadFixture('metro-station-of-line.json') as MetroStationOfLine[];
const liveBoardFixture = loadFixture('metro-live-board.json') as MetroLiveBoard[];
const firstLastFixture = loadFixture(
  'metro-first-last-timetable.json',
) as MetroFirstLastTimetable[];
const odFareFixture = loadFixture('metro-od-fare.json') as MetroODFare[];
const alertsFixture = loadFixture('metro-alert-trtc.json') as MetroAlerts;
const exitsFixture = loadFixture('metro-station-exit-trtc.json') as MetroStationExit[];
const facilitiesFixture = loadFixture('metro-station-facility-trtc.json') as MetroStationFacility[];
const lineTransfersFixture = loadFixture('metro-line-transfer-trtc.json') as MetroLineTransfer[];
const stationTransfersFixture = loadFixture(
  'metro-station-transfer-trtc.json',
) as MetroStationTransfers;
const routesFixture = loadFixture('metro-route-trtc.json') as MetroRoute[];
const stationsOfRouteFixture = loadFixture(
  'metro-station-of-route-trtc.json',
) as MetroStationOfRoute[];
const frequencyFixture = loadFixture('metro-frequency-trtc.json') as MetroFrequency[];
const stationTimetableFixture = loadFixture(
  'metro-station-timetable-trtc.json',
) as MetroStationTimetable[];
const newsFixture = loadFixture('metro-news-trtc.json') as MetroNewsList;
const networkFixture = loadFixture('metro-network-trtc.json') as MetroNetwork[];
const travelTimeFixture = loadFixture('metro-s2s-travel-time-trtc.json') as MetroS2STravelTime[];
const shapeFixture = loadFixture('metro-shape-trtc.json') as MetroShape[];
const platformsFixture = loadFixture('metro-station-platform-klrt.json') as MetroStationPlatforms;
const patternsFixture = loadFixture('metro-stopping-pattern-tymc.json') as MetroStoppingPatterns;
const transferStationsFixture = loadFixture(
  'metro-transfer-stations-trtc-ntmc.json',
) as MetroTransferStation[];

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

describe('tdx.metro.alerts', () => {
  it('requests the alerts of a rail system, applying the query to its Alerts', async () => {
    const { tdx, apiUrls } = clientWithResponse(alertsFixture);

    await tdx.metro.alerts('TRTC');
    await tdx.metro.alerts('KRTC', query<MetroAlert>().filter('Status ne 1'));

    expect(decodeURIComponent(apiUrls.join(' '))).toBe(
      `${API}/v2/Rail/Metro/Alert/TRTC?$format=JSON ` +
        `${API}/v2/Rail/Metro/Alert/KRTC?$filter=Status ne 1&$format=JSON`,
    );
  });

  it('parses the normal-day alert wrapper', async () => {
    const { tdx } = clientWithResponse(alertsFixture);

    const result = await tdx.metro.alerts('TRTC');
    expectTypeOf(result).toEqualTypeOf<MetroAlerts>();

    expect(result).toMatchObject({ AuthorityCode: 'TRTC', UpdateInterval: 60 });
    expect(result.Alerts.map((a) => [a.Title, a.Status])).toEqual([['正常營運', 1]]);
    expect(result.Alerts[0]?.Scope).toMatchObject({ Network: {}, Stations: [], Lines: [] });
  });

  it('surfaces an unsupported system as TdxApiError', async () => {
    const message = "RailSystem: 'NTDLRT' is not accepted but TYMC, KRTC, KLRT, TRTC, TRTCMG, TMRT";
    const { tdx } = clientWithResponse(null, {
      fetch: (url: string) =>
        Promise.resolve(
          url.includes('/token') ? tokenResponse() : jsonResponse({ Message: message }, 400),
        ),
    });

    await expect(tdx.metro.alerts('NTDLRT')).rejects.toMatchObject({
      name: 'TdxApiError',
      status: 400,
    });
  });
});

describe('tdx.metro station info, routes, frequency, timetables, news and positions', () => {
  it('requests each list endpoint as JSON', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.metro.stationExits('TRTC');
    await tdx.metro.stationFacilities('TRTC');
    await tdx.metro.lineTransfers('TRTC');
    await tdx.metro.routes('TRTC');
    await tdx.metro.stationsOfRoute('TRTC');
    await tdx.metro.frequency('TRTC');
    await tdx.metro.stationTimetable('TRTC', { filter: "StationID eq 'BL01'" });

    expect(apiUrls).toEqual([
      ...[
        'StationExit',
        'StationFacility',
        'LineTransfer',
        'Route',
        'StationOfRoute',
        'Frequency',
      ].map((kind) => `${API}/v2/Rail/Metro/${kind}/TRTC?$format=JSON`),
      `${API}/v2/Rail/Metro/StationTimeTable/TRTC?$filter=StationID%20eq%20'BL01'&$format=JSON`,
    ]);
  });

  it('requests the wrapper endpoints as JSON and validates the system', async () => {
    const { tdx, apiUrls } = clientWithResponse({});

    await tdx.metro.stationTransfers('TRTC');
    await tdx.metro.news('TRTC', { top: 2 });
    await tdx.metro.livePosition('KLRT');

    expect(apiUrls).toEqual([
      `${API}/v2/Rail/Metro/StationTransfer/TRTC?$format=JSON`,
      `${API}/v2/Rail/Metro/News/TRTC?$top=2&$format=JSON`,
      `${API}/v2/Rail/Metro/LivePosition/KLRT?$format=JSON`,
    ]);
    expect(() => tdx.metro.stationExits('')).toThrow(TypeError);
    expect(() => tdx.metro.news(' ')).toThrow(TypeError);
    await expect(clientWithResponse([]).tdx.metro.news('TRTC')).rejects.toBeInstanceOf(TdxApiError);
  });

  it('parses exits, facilities and line transfers', async () => {
    const exits = await clientWithResponse(exitsFixture).tdx.metro.stationExits('TRTC');
    const facilities =
      await clientWithResponse(facilitiesFixture).tdx.metro.stationFacilities('TRTC');
    const transfers =
      await clientWithResponse(lineTransfersFixture).tdx.metro.lineTransfers('TRTC');
    expectTypeOf(exits).toEqualTypeOf<MetroStationExit[]>();
    expectTypeOf(facilities).toEqualTypeOf<MetroStationFacility[]>();
    expectTypeOf(transfers).toEqualTypeOf<MetroLineTransfer[]>();

    expect(exits.map((e) => [e.StationID, e.ExitID, e.Stair, e.Escalator, e.Elevator])).toEqual([
      ['BL01', '1', true, 2, true],
      ['BL01', '2', true, 2, false],
    ]);
    expect(facilities[0]?.FacilityMapURLs?.[0]?.MapURL).toMatch(/^https:\/\/web\.metro\.taipei\//);
    expect(facilities[0]?.Elevators).toEqual([]);
    expect(transfers[0]).toMatchObject({ FromLineID: 'BL', FromStationID: 'BL01', ToLineID: 'LB' });
  });

  it('parses station transfers, routes and stations of route', async () => {
    const station =
      await clientWithResponse(stationTransfersFixture).tdx.metro.stationTransfers('TRTC');
    const routes = await clientWithResponse(routesFixture).tdx.metro.routes('TRTC');
    const stations =
      await clientWithResponse(stationsOfRouteFixture).tdx.metro.stationsOfRoute('TRTC');
    expectTypeOf(station).toEqualTypeOf<MetroStationTransfers>();
    expectTypeOf(routes).toEqualTypeOf<MetroRoute[]>();
    expectTypeOf(stations).toEqualTypeOf<MetroStationOfRoute[]>();

    expect(station.UpdateInterval).toBe(0);
    expect(station.StationTransfers[0]?.StationID).toBe('BL01');
    expect(Object.keys(station.StationTransfers[0]?.Transfers?.[0] ?? {})).toEqual([
      'BikeTransfers',
      'ParkingTransfers',
    ]);
    expect(routes.map((r) => [r.RouteID, r.RailRouteType, r.Direction, r.TravelTime])).toEqual([
      ['BL-1', 33, 0, 48],
      ['BL-1', 33, 1, 48],
    ]);
    expect(stations[0]?.Stations.map((s) => [s.Sequence, s.StationID])).toEqual([
      [1, 'BL01'],
      [2, 'BL02'],
      [3, 'BL03'],
    ]);
  });

  it('parses headways, station timetables and news', async () => {
    const frequency = await clientWithResponse(frequencyFixture).tdx.metro.frequency('TRTC');
    const timetable =
      await clientWithResponse(stationTimetableFixture).tdx.metro.stationTimetable('TRTC');
    const news = await clientWithResponse(newsFixture).tdx.metro.news('TRTC');
    expectTypeOf(frequency).toEqualTypeOf<MetroFrequency[]>();
    expectTypeOf(timetable).toEqualTypeOf<MetroStationTimetable[]>();
    expectTypeOf(news).toEqualTypeOf<MetroNewsList>();

    expect(
      frequency.map((f) => [f.RouteID, f.ServiceDay.ServiceTag, f.Headways[0]?.MinHeadwayMins]),
    ).toEqual([
      ['BL-1', '平日', 8],
      ['BL-1', '假日', 8],
    ]);
    const first = timetable[0];
    expect([first?.StationID, first?.DestinationStaionID, first?.ServiceDay.Saturday]).toEqual([
      'BL01',
      'BL23',
      true,
    ]);
    expect(first?.Timetables.map((t) => t.DepartureTime)).toEqual(['06:00', '06:07', '06:15']);
    expect(news.Newses[0]).toMatchObject({ NewsID: '9726526', NewsCategory: 2 });
    expect(news.Newses[0]?.Language).toBeUndefined();
    expect(news.Newses[0]?.PublishTime).toBe('0001-01-01T00:00:00+08:06');
  });
});

describe('tdx.metro network, travel times, shapes, platforms, stopping patterns and shared stations', () => {
  it('requests each endpoint as JSON', async () => {
    const lists = clientWithResponse([]);
    const objects = clientWithResponse({});

    await lists.tdx.metro.network('TRTC');
    await lists.tdx.metro.s2sTravelTime('TRTC', { top: 1 });
    await lists.tdx.metro.shapes('NTDLRT');
    await lists.tdx.metro.transferStations('TRTC_NTMC');
    await objects.tdx.metro.stationPlatforms('KLRT');
    await objects.tdx.metro.stoppingPatterns('TYMC', { top: 2 });

    expect(lists.apiUrls).toEqual([
      `${API}/v2/Rail/Metro/Network/TRTC?$format=JSON`,
      `${API}/v2/Rail/Metro/S2STravelTime/TRTC?$top=1&$format=JSON`,
      `${API}/v2/Rail/Metro/Shape/NTDLRT?$format=JSON`,
      `${API}/v2/Rail/Metro/TransferStations/TRTC_NTMC?$format=JSON`,
    ]);
    expect(objects.apiUrls).toEqual([
      `${API}/v2/Rail/Metro/StationPlatform/KLRT?$format=JSON`,
      `${API}/v2/Rail/Metro/StoppingPattern/TYMC?$top=2&$format=JSON`,
    ]);
    expect(() => lists.tdx.metro.network('')).toThrow(TypeError);
    expect(() => objects.tdx.metro.stationPlatforms(' ')).toThrow(TypeError);
    await expect(lists.tdx.metro.stoppingPatterns('TYMC')).rejects.toBeInstanceOf(TdxApiError);
  });

  it('parses the network, travel times and shapes', async () => {
    const network = await clientWithResponse(networkFixture).tdx.metro.network('TRTC');
    const times = await clientWithResponse(travelTimeFixture).tdx.metro.s2sTravelTime('TRTC');
    const shapes = await clientWithResponse(shapeFixture).tdx.metro.shapes('TRTC');
    expectTypeOf(network).toEqualTypeOf<MetroNetwork[]>();
    expectTypeOf(times).toEqualTypeOf<MetroS2STravelTime[]>();
    expectTypeOf(shapes).toEqualTypeOf<MetroShape[]>();

    expect(network[0]?.NetworkID).toBe('TRTC-Network');
    expect(network[0]?.Lines.map((l) => l.LineID)).toEqual(['R', 'O', 'G', 'BR', 'BL']);
    expect(times.map((t) => [t.RouteID, t.TrainType, t.TravelTimes[0]?.RunTime])).toEqual([
      ['BL-1', 1, 112],
      ['BL-2', 1, 112],
    ]);
    expect(shapes[0]?.LineID).toBe('BL');
    expect(shapes[0]?.Geometry).toMatch(/^MULTILINESTRING\(\(/);
    expect(shapes[0]?.EncodedPolyline).toBe('');
  });

  it('parses platforms, stopping patterns and shared stations', async () => {
    const platforms = await clientWithResponse(platformsFixture).tdx.metro.stationPlatforms('KLRT');
    const patterns = await clientWithResponse(patternsFixture).tdx.metro.stoppingPatterns('TYMC');
    const shared =
      await clientWithResponse(transferStationsFixture).tdx.metro.transferStations('TRTC_NTMC');
    expectTypeOf(platforms).toEqualTypeOf<MetroStationPlatforms>();
    expectTypeOf(patterns).toEqualTypeOf<MetroStoppingPatterns>();
    expectTypeOf(shared).toEqualTypeOf<MetroTransferStation[]>();

    expect(platforms.AuthorityCode).toBeUndefined();
    expect(platforms.StationPlatforms.map((p) => [p.PlatformID, p.Direction])).toEqual([
      ['C1-1', 0],
      ['C1-2', 1],
    ]);
    expect(patterns.UpdateInterval).toBe(-1);
    expect(
      patterns.StoppingPatterns.map((p) => [
        p.StoppingPatternID,
        p.Stations.map((s) => s.StationID),
      ]),
    ).toEqual([
      ['SP1', ['A1', 'A2', 'A3']],
      ['SP2', ['A1', 'A3', 'A8']],
    ]);
    expect(shared.map((s) => [s.TransferStationID, s.Stations?.map((x) => x.StationID)])).toEqual([
      ['BL07_Y16', ['BL07', 'Y16']],
      ['BL11_G12', ['BL11', 'G12']],
    ]);
    expect(shared[0]?.Stations?.[0]?.StationName).toBe('板橋');
  });
});
