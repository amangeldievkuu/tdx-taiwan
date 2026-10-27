import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  type BusEstimatedTimeOfArrival,
  type BusPosition,
  type BusRoute,
  type BusStation,
  type BusStopInfo,
  type BusStopOfRoute,
  query,
} from '../../src/index.js';
import { API, clientWithResponse, loadFixture } from '../helpers.js';

const decoded = (urls: string[]) => urls.map((u) => decodeURIComponent(u));

const routesFixture = loadFixture('bus-route-taipei-307.json') as BusRoute[];
const stopsFixture = loadFixture('bus-stop-of-route-taipei-307.json') as BusStopOfRoute[];
const etaFixture = loadFixture('bus-eta-taipei-307.json') as BusEstimatedTimeOfArrival[];
const stopsInfoFixture = loadFixture('bus-stop-taipei.json') as BusStopInfo[];
const stationsFixture = loadFixture('bus-station-taipei.json') as BusStation[];
const interCityStationsFixture = loadFixture('bus-station-intercity.json') as BusStation[];
const positionsFixture = loadFixture('bus-position-taipei-307.json') as BusPosition[];
const interCityRouteFixture = loadFixture('bus-intercity-route-1610.json') as BusRoute[];
const interCityEtaFixture = loadFixture(
  'bus-intercity-eta-1610.json',
) as BusEstimatedTimeOfArrival[];

describe('tdx.bus.routes', () => {
  it('requests every route in a city', async () => {
    const { tdx, apiUrls } = clientWithResponse(routesFixture);

    await tdx.bus.routes('Taipei');

    expect(apiUrls).toEqual([`${API}/v2/Bus/Route/City/Taipei?$format=JSON`]);
  });

  it('requests a route by exact name, percent-encoding Chinese names', async () => {
    const { tdx, apiUrls } = clientWithResponse(routesFixture);

    await tdx.bus.routes('Taipei', '307');
    await tdx.bus.routes('Taipei', '紅5', { select: ['RouteUID'] });

    expect(apiUrls).toEqual([
      `${API}/v2/Bus/Route/City/Taipei/307?$filter=RouteName%2FZh_tw%20eq%20'307'&$format=JSON`,
      `${API}/v2/Bus/Route/City/Taipei/%E7%B4%855` +
        `?$select=RouteUID&$filter=RouteName%2FZh_tw%20eq%20'%E7%B4%855'&$format=JSON`,
    ]);
  });

  it('keeps TDX prefix matching with exact: false', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.bus.routes('Taipei', '307', { exact: false });
    await tdx.bus.routes('Taipei', '307', { exact: false, top: 2 });

    expect(apiUrls).toEqual([
      `${API}/v2/Bus/Route/City/Taipei/307?$format=JSON`,
      `${API}/v2/Bus/Route/City/Taipei/307?$top=2&$format=JSON`,
    ]);
  });

  it('requests names containing a slash by their prefix and filters on the full name', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.bus.routes('KinmenCounty', ' 15A往烈嶼 (后頭進/黃厝出) ');

    expect(decoded(apiUrls)).toEqual([
      `${API}/v2/Bus/Route/City/KinmenCounty/15A往烈嶼 (后頭進` +
        `?$filter=RouteName/Zh_tw eq '15A往烈嶼 (后頭進/黃厝出)'&$format=JSON`,
    ]);
  });

  it('escapes quotes in the route name filter', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.bus.routes('Taipei', "O'Neil");

    expect(decoded(apiUrls)).toEqual([
      `${API}/v2/Bus/Route/City/Taipei/O'Neil?$filter=RouteName/Zh_tw eq 'O''Neil'&$format=JSON`,
    ]);
  });

  it('accepts a query without a route name', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.bus.routes('Taichung', query<BusRoute>().top(5));

    expect(apiUrls).toEqual([`${API}/v2/Bus/Route/City/Taichung?$top=5&$format=JSON`]);
  });

  it('parses routes with operators and sub-routes', async () => {
    const { tdx } = clientWithResponse(routesFixture);

    const routes = await tdx.bus.routes('Taipei', '307');
    expectTypeOf(routes).toEqualTypeOf<BusRoute[]>();

    const [route] = routes;
    expect(route).toMatchObject({
      RouteUID: 'TPE16111',
      RouteName: { Zh_tw: '307' },
      BusRouteType: 11,
      HasSubRoutes: true,
      City: 'Taipei',
    });
    expect(route?.Operators[0]?.OperatorName.Zh_tw).toBe('臺北客運');
    expect(route?.SubRoutes?.map((s) => [s.Direction, s.Headsign])).toEqual([
      [0, '撫遠街'],
      [1, '板橋前站'],
    ]);
  });
});

describe('tdx.bus.stopsOfRoute', () => {
  it('requests the stop sequence of a route', async () => {
    const { tdx, apiUrls } = clientWithResponse(stopsFixture);

    await tdx.bus.stopsOfRoute('Taipei', '307');
    await tdx.bus.stopsOfRoute('Taipei', '307', { exact: false });

    expect(decoded(apiUrls)).toEqual([
      `${API}/v2/Bus/StopOfRoute/City/Taipei/307?$filter=RouteName/Zh_tw eq '307'&$format=JSON`,
      `${API}/v2/Bus/StopOfRoute/City/Taipei/307?$format=JSON`,
    ]);
  });

  it('parses ordered stops with positions and boarding flags', async () => {
    const { tdx } = clientWithResponse(stopsFixture);

    const result = await tdx.bus.stopsOfRoute('Taipei', '307');
    expectTypeOf(result).toEqualTypeOf<BusStopOfRoute[]>();

    const stops = result[0]?.Stops ?? [];
    expect(result[0]).toMatchObject({ SubRouteUID: 'TPE157462', Direction: 0 });
    expect(stops.map((s) => [s.StopSequence, s.StopName.Zh_tw, s.StopBoarding])).toEqual([
      [1, '板橋前站', 1],
      [2, '捷運西門站', 0],
      [3, '撫遠街', -1],
    ]);
    expect(stops[1]?.StopPosition).toMatchObject({ PositionLat: 25.04238, PositionLon: 121.50806 });
    expect(stops[2]?.StationID).toBeUndefined();
  });
});

describe('tdx.bus.eta', () => {
  it('requests the ETA of a route', async () => {
    const { tdx, apiUrls } = clientWithResponse(etaFixture);

    await tdx.bus.eta('Taipei', '307');
    await tdx.bus.eta('Taipei', '307', { exact: false });

    expect(decoded(apiUrls)).toEqual([
      `${API}/v2/Bus/EstimatedTimeOfArrival/City/Taipei/307` +
        `?$filter=RouteName/Zh_tw eq '307'&$format=JSON`,
      `${API}/v2/Bus/EstimatedTimeOfArrival/City/Taipei/307?$format=JSON`,
    ]);
  });

  it('parses estimates, not-yet-departed and last-bus-passed stops', async () => {
    const { tdx } = clientWithResponse(etaFixture);

    const eta = await tdx.bus.eta('Taipei', '307');
    expectTypeOf(eta).toEqualTypeOf<BusEstimatedTimeOfArrival[]>();

    expect(eta.map((e) => [e.StopName?.Zh_tw, e.StopStatus, e.EstimateTime])).toEqual([
      ['捷運西門站', 0, 240],
      ['板橋前站', 1, 420],
      ['撫遠街', 3, null],
    ]);
    expect(eta[0]?.Estimates?.map((e) => e.PlateNumb)).toEqual(['EAL-0123', 'EAL-0456']);
    expect(eta[1]).toMatchObject({ PlateNumb: '-1', NextBusTime: '2026-10-20T10:22:00+08:00' });
  });

  it('builds the filter for a single stop', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.bus.eta('Taipei', '307', {
      filter: "StopUID eq 'TPE38262'",
      orderBy: 'StopSequence',
    });

    expect(decodeURIComponent(apiUrls[0] ?? '')).toBe(
      `${API}/v2/Bus/EstimatedTimeOfArrival/City/Taipei/307` +
        `?$filter=(StopUID eq 'TPE38262') and (RouteName/Zh_tw eq '307')` +
        `&$orderby=StopSequence&$format=JSON`,
    );
  });

  it('adds the route filter to a copy of a query builder', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);
    const q = query<BusEstimatedTimeOfArrival>().filter('Direction eq 0').top(5);

    await tdx.bus.eta('Taipei', '307', q);

    expect(decoded(apiUrls)).toEqual([
      `${API}/v2/Bus/EstimatedTimeOfArrival/City/Taipei/307` +
        `?$filter=(Direction eq 0) and (RouteName/Zh_tw eq '307')&$top=5&$format=JSON`,
    ]);
    expect(q.toString()).toBe('$filter=Direction%20eq%200&$top=5&$format=JSON');
  });

  it('validates the route name', () => {
    const { tdx } = clientWithResponse([]);

    expect(() => tdx.bus.eta('Taipei', '  ')).toThrow(TypeError);
    expect(() => tdx.bus.eta('Taipei', '/x')).toThrow(TypeError);
    expect(() => tdx.bus.eta('Taipei', '  ', { exact: false })).toThrow(TypeError);
  });
});

describe('tdx.bus.stops', () => {
  it('requests every stop in a city, with a query', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.bus.stops('Taipei');
    await tdx.bus.stops('Taipei', { select: ['StopUID', 'StopName'], top: 10 });

    expect(decoded(apiUrls)).toEqual([
      `${API}/v2/Bus/Stop/City/Taipei?$format=JSON`,
      `${API}/v2/Bus/Stop/City/Taipei?$select=StopUID,StopName&$top=10&$format=JSON`,
    ]);
  });

  it('parses stops, which lack StationGroupID in Taipei', async () => {
    const { tdx } = clientWithResponse(stopsInfoFixture);

    const stops = await tdx.bus.stops('Taipei');
    expectTypeOf(stops).toEqualTypeOf<BusStopInfo[]>();

    expect(stops.map((s) => [s.StopUID, s.StopName.Zh_tw, s.Bearing, s.City])).toEqual([
      ['TPE10000', '蘆洲總站', 'SE', 'Taipei'],
      ['TPE10001', '南港分局(重陽)', 'NE', 'Taipei'],
    ]);
    expect(stops[0]?.StationGroupID).toBeUndefined();
    expect(stops[0]?.StopPosition.PositionLat).toBe(25.089056);
  });
});

describe('tdx.bus.positions', () => {
  it('requests live positions of a route by exact name', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.bus.positions('Taipei', '307');
    await tdx.bus.positions('Taipei', '307', { exact: false });

    expect(decoded(apiUrls)).toEqual([
      `${API}/v2/Bus/RealTimeByFrequency/City/Taipei/307` +
        `?$filter=RouteName/Zh_tw eq '307'&$format=JSON`,
      `${API}/v2/Bus/RealTimeByFrequency/City/Taipei/307?$format=JSON`,
    ]);
  });

  it('parses positions', async () => {
    const { tdx } = clientWithResponse(positionsFixture);

    const positions = await tdx.bus.positions('Taipei', '307');
    expectTypeOf(positions).toEqualTypeOf<BusPosition[]>();

    expect(positions.map((p) => [p.PlateNumb, p.Direction, p.Speed, p.DutyStatus])).toEqual([
      ['208-U5', 0, 0, 1],
      ['266-U5', 0, 10, 1],
    ]);
    expect(positions[1]?.BusPosition).toMatchObject({
      PositionLat: 25.011048,
      PositionLon: 121.461627,
    });
  });
});

describe('tdx.bus.interCity', () => {
  it('requests InterCity routes, stops, ETA and positions by exact name', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.bus.interCity.routes();
    await tdx.bus.interCity.routes({ top: 5 });
    await tdx.bus.interCity.routes('1610');
    await tdx.bus.interCity.stopsOfRoute('1610');
    await tdx.bus.interCity.eta('1610');
    await tdx.bus.interCity.positions('1610');

    const exact = `?$filter=RouteName/Zh_tw eq '1610'&$format=JSON`;
    expect(decoded(apiUrls)).toEqual([
      `${API}/v2/Bus/Route/InterCity?$format=JSON`,
      `${API}/v2/Bus/Route/InterCity?$top=5&$format=JSON`,
      `${API}/v2/Bus/Route/InterCity/1610${exact}`,
      `${API}/v2/Bus/StopOfRoute/InterCity/1610${exact}`,
      `${API}/v2/Bus/EstimatedTimeOfArrival/InterCity/1610${exact}`,
      `${API}/v2/Bus/RealTimeByFrequency/InterCity/1610${exact}`,
    ]);
  });

  it('keeps TDX prefix matching with exact: false', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.bus.interCity.routes('9', { exact: false });

    expect(apiUrls).toEqual([`${API}/v2/Bus/Route/InterCity/9?$format=JSON`]);
  });

  it('parses InterCity routes and ETA with the city types', async () => {
    const routes = clientWithResponse(interCityRouteFixture);
    const [route] = await routes.tdx.bus.interCity.routes('1610');
    expectTypeOf(route).toEqualTypeOf<BusRoute | undefined>();
    expect(route).toMatchObject({ RouteUID: 'THB1610', BusRouteType: 13 });
    expect(route?.Operators[0]?.OperatorName.Zh_tw).toBe('統聯客運');

    const eta = clientWithResponse(interCityEtaFixture);
    const estimates = await eta.tdx.bus.interCity.eta('1610');
    expect(estimates.map((e) => [e.StopName?.Zh_tw, e.StopStatus, e.EstimateTime])).toEqual([
      ['建國客運站', 1, undefined],
      ['建國客運站', 3, undefined],
    ]);
  });

  it('validates the route name', () => {
    const { tdx } = clientWithResponse([]);

    expect(() => tdx.bus.interCity.eta(' ')).toThrow(TypeError);
    expect(() => tdx.bus.positions('Taipei', '')).toThrow(TypeError);
  });
});

describe('tdx.bus.stations', () => {
  it('requests the stations of a city, or those near a point', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.bus.stations('Taipei');
    await tdx.bus.stations('Taipei', { nearby: { lat: 25.0478, lon: 121.517, meters: 150 } });
    await tdx.bus.stations('Kaohsiung', query<BusStation>().nearby(22.64, 120.3, 200).top(5));

    expect(decoded(apiUrls)).toEqual([
      `${API}/v2/Bus/Station/City/Taipei?$format=JSON`,
      `${API}/v2/Bus/Station/City/Taipei?$spatialFilter=nearby(25.0478,121.517,150)&$format=JSON`,
      `${API}/v2/Bus/Station/City/Kaohsiung?$top=5&$spatialFilter=nearby(22.64,120.3,200)` +
        '&$format=JSON',
    ]);
  });

  it('validates the city', () => {
    const { tdx } = clientWithResponse([]);
    expect(() => tdx.bus.stations('')).toThrow(TypeError);
  });

  it('parses stations with the route of each stop', async () => {
    const { tdx } = clientWithResponse(stationsFixture);

    const stations = await tdx.bus.stations('Taipei');
    expectTypeOf(stations).toEqualTypeOf<BusStation[]>();

    expect(stations[0]).toMatchObject({
      StationUID: 'TPE1000082',
      StationName: { Zh_tw: '臺北車站(忠孝)' },
      Bearing: 'W',
      LocationCityCode: 'TPE',
    });
    expect(stations[0]?.StationName.En).toBeUndefined();
    expect(stations[0]?.StationGroupID).toBeUndefined();
    expect(stations[0]?.Stops?.map((s) => s.RouteName.Zh_tw)).toEqual(['205', '221', '232']);
  });
});

describe('tdx.bus.interCity.stations', () => {
  it('requests InterCity stations, with a query', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.bus.interCity.stations({ nearby: { lat: 25.0478, lon: 121.517, meters: 150 } });

    expect(decoded(apiUrls)).toEqual([
      `${API}/v2/Bus/Station/InterCity?$spatialFilter=nearby(25.0478,121.517,150)&$format=JSON`,
    ]);
  });

  it('parses coach stations, which have a station group', async () => {
    const { tdx } = clientWithResponse(interCityStationsFixture);

    const [station] = await tdx.bus.interCity.stations();

    expect(station?.StationName.Zh_tw).toBe('臺北轉運站');
    expect(station?.StationGroupID).toBeTruthy();
    expect(station?.Stops?.[0]?.RouteName.Zh_tw).toBe('1610');
  });
});
