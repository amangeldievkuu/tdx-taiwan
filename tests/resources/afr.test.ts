import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  type AfrGeneralTimetables,
  type AfrLines,
  type AfrNetworks,
  type AfrNewsList,
  type AfrODFare,
  type AfrODFares,
  type AfrOperators,
  type AfrRoutes,
  type AfrShapes,
  type AfrStationOfLines,
  type AfrStationOfRoutes,
  type AfrStations,
  type AfrTrainTypes,
  TdxApiError,
  query,
} from '../../src/index.js';
import { API, clientWithResponse, loadFixture } from '../helpers.js';

const stationsFixture = loadFixture('afr-station.json') as AfrStations;
const linesFixture = loadFixture('afr-line.json') as AfrLines;
const stationsOfLineFixture = loadFixture('afr-station-of-line.json') as AfrStationOfLines;
const routesFixture = loadFixture('afr-route.json') as AfrRoutes;
const stationsOfRouteFixture = loadFixture('afr-station-of-route.json') as AfrStationOfRoutes;
const networkFixture = loadFixture('afr-network.json') as AfrNetworks;
const shapesFixture = loadFixture('afr-shape.json') as AfrShapes;
const operatorsFixture = loadFixture('afr-operator.json') as AfrOperators;
const trainTypesFixture = loadFixture('afr-train-type.json') as AfrTrainTypes;
const timetableFixture = loadFixture('afr-general-timetable.json') as AfrGeneralTimetables;
const faresFixture = loadFixture('afr-od-fare.json') as AfrODFares;
const newsFixture = loadFixture('afr-news.json') as AfrNewsList;

describe('tdx.afr', () => {
  it('requests each endpoint as JSON', async () => {
    const { tdx, apiUrls } = clientWithResponse({});

    await tdx.afr.stations();
    await tdx.afr.lines({ top: 2 });
    await tdx.afr.stationsOfLine();
    await tdx.afr.routes();
    await tdx.afr.stationsOfRoute();
    await tdx.afr.network();
    await tdx.afr.shapes();
    await tdx.afr.operators();
    await tdx.afr.trainTypes();
    await tdx.afr.generalTimetable();
    await tdx.afr.generalTimetable({ top: 1 });
    await tdx.afr.generalTimetable('1');
    await tdx.afr.odFare();
    await tdx.afr.odFare(query<AfrODFare>().filter('TrainType eq 1'));
    await tdx.afr.odFare('360', '378');
    await tdx.afr.odFare('360', '378', { top: 1 });
    await tdx.afr.news();

    expect(apiUrls).toEqual(
      [
        '/Station',
        '/Line?$top=2',
        '/StationOfLine',
        '/Route',
        '/StationOfRoute',
        '/Network',
        '/Shape',
        '/Operator',
        '/TrainType',
        '/GeneralTrainTimetable',
        '/GeneralTrainTimetable?$top=1',
        '/GeneralTrainTimetable/TrainNo/1',
        '/ODFare',
        '/ODFare?$filter=TrainType%20eq%201',
        '/ODFare/360/to/378',
        '/ODFare/360/to/378?$top=1',
        '/News',
      ].map((p) => `${API}/v3/Rail/AFR${p}${p.includes('?') ? '&' : '?'}$format=JSON`),
    );
    expect(() => tdx.afr.generalTimetable('')).toThrow(TypeError);
    expect(() => tdx.afr.odFare('360', ' ')).toThrow(TypeError);
    await expect(clientWithResponse([]).tdx.afr.stations()).rejects.toBeInstanceOf(TdxApiError);
  });

  it('parses stations, lines, routes and their station lists', async () => {
    const stations = await clientWithResponse(stationsFixture).tdx.afr.stations();
    const lines = await clientWithResponse(linesFixture).tdx.afr.lines();
    const stationsOfLine = await clientWithResponse(stationsOfLineFixture).tdx.afr.stationsOfLine();
    const routes = await clientWithResponse(routesFixture).tdx.afr.routes();
    const stationsOfRoute =
      await clientWithResponse(stationsOfRouteFixture).tdx.afr.stationsOfRoute();
    expectTypeOf(stations).toEqualTypeOf<AfrStations>();
    expectTypeOf(lines).toEqualTypeOf<AfrLines>();
    expectTypeOf(stationsOfLine).toEqualTypeOf<AfrStationOfLines>();
    expectTypeOf(routes).toEqualTypeOf<AfrRoutes>();
    expectTypeOf(stationsOfRoute).toEqualTypeOf<AfrStationOfRoutes>();

    expect(stations.AuthorityCode).toBe('AFR');
    expect(stations.Stations.map((s) => [s.StationID, s.StationClass, s.StationUID])).toEqual([
      ['360', 'X', 'AFR-360'],
      ['361', '1', 'AFR-361'],
    ]);
    expect(lines.Lines.map((l) => [l.LineID, l.LineNo, l.IsBranch])).toEqual([
      ['1', 'M-1', false],
      ['2', 'B-2', true],
      ['3', 'B-3', true],
      ['4', 'B-4', true],
    ]);
    expect(stationsOfLine.StationOfLines[0]?.Stations.map((s) => s.StationID)).toEqual([
      '360',
      '361',
      '362',
    ]);
    expect(routes.Routes.map((r) => [r.RouteID, r.RouteType, r.EndStationID])).toEqual([
      ['1', 36, '378'],
      ['2', 36, '381'],
    ]);
    // The source swaps the languages of the route end names.
    expect(routes.Routes[0]?.StartStationName).toEqual({ Zh_tw: 'Chiayi', En: '嘉義' });
    expect(stationsOfRoute.StationOfRoutes[0]).toMatchObject({ RouteID: '1', Direction: 0 });
  });

  it('parses the network, shapes, operators and train types', async () => {
    const network = await clientWithResponse(networkFixture).tdx.afr.network();
    const shapes = await clientWithResponse(shapesFixture).tdx.afr.shapes();
    const operators = await clientWithResponse(operatorsFixture).tdx.afr.operators();
    const types = await clientWithResponse(trainTypesFixture).tdx.afr.trainTypes();
    expectTypeOf(network).toEqualTypeOf<AfrNetworks>();
    expectTypeOf(shapes).toEqualTypeOf<AfrShapes>();
    expectTypeOf(operators).toEqualTypeOf<AfrOperators>();
    expectTypeOf(types).toEqualTypeOf<AfrTrainTypes>();

    expect(network.Networks[0]?.NetworkID).toBe('AFR-Network');
    expect(network.Networks[0]?.NetworkMapURL.Zh_tw).toBe('https://afrch.forest.gov.tw/0000275');
    expect(network.Networks[0]?.Lines.map((l) => l.LineNo)).toEqual(['M-1', 'B-2', 'B-3', 'B-4']);
    expect(shapes.Shapes[0]?.LineID).toBe('2');
    expect(shapes.Shapes[0]?.Geometry).toMatch(/^MULTILINESTRING\(/);
    expect(operators.Operators[0]?.OperatorCode).toBe('AFR');
    expect(operators.Operators[0]?.OperatorLogoURL).toBeUndefined();
    expect(types.TrainTypes.map((t) => [t.TrainTypeCode, t.TrainTypeName.Zh_tw])).toEqual([
      ['1', '中興號'],
      ['2', '區間'],
      ['3', '主題式列車'],
      ['5', '阿里山號'],
      ['6', '祝客'],
      ['7', '祝客（祝山線）'],
      ['8', '檜木車廂'],
    ]);
  });

  it('parses the general timetable, fares and news', async () => {
    const timetable = await clientWithResponse(timetableFixture).tdx.afr.generalTimetable('1');
    const fares = await clientWithResponse(faresFixture).tdx.afr.odFare('360', '361');
    const news = await clientWithResponse(newsFixture).tdx.afr.news();
    expectTypeOf(timetable).toEqualTypeOf<AfrGeneralTimetables>();
    expectTypeOf(fares).toEqualTypeOf<AfrODFares>();
    expectTypeOf(news).toEqualTypeOf<AfrNewsList>();

    expect([timetable.AuthorityCode, timetable.SrcVersion, timetable.TimetableName]).toEqual([
      undefined,
      '10',
      '常態性時刻表',
    ]);
    const train = timetable.TrainTimetables[0];
    expect(train?.TrainInfo.TrainNo).toBe('1');
    expect(train?.TrainInfo.TrainTypeCode).toBeUndefined();
    expect(train?.ServiceDay).toMatchObject({
      ServiceTag: '請參閱官網',
      Sunday: 1,
      DayBeforeHoliday: 0,
    });
    expect(train?.ServiceDay.TyphoonDay).toBeUndefined();
    expect(train?.StopTimes.map((s) => [s.StationID, s.DepartureTime])).toEqual([
      ['360', '09:00'],
      ['361', '09:10'],
      ['362', '09:33'],
    ]);
    expect([fares.EffectiveDate, fares.ExpireDate]).toEqual(['2017-04-12', '']);
    expect(
      fares.ODFares.map((f) => [
        f.TrainType,
        f.Fares.map((x) => [x.FareClass, x.CabinClass, x.Price]),
      ]),
    ).toEqual([
      [
        1,
        [
          [1, 1, 45],
          [2, 1, 23],
        ],
      ],
      [
        5,
        [
          [1, 2, 50],
          [2, 2, 25],
        ],
      ],
    ]);
    expect(news.UpdateInterval).toBe(120);
    expect(news.Newses[0]).toMatchObject({ NewsID: '1', Language: 1, NewsCategory: 1 });
  });
});
