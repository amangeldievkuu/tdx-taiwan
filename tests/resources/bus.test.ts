import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  type BusAlert,
  type BusDisplayStopOfRoute,
  type BusEstimatedTimeOfArrival,
  type BusFirstLastTripInfo,
  type BusNearStop,
  type BusNews,
  type BusOperator,
  type BusPosition,
  type BusRoute,
  type BusRouteFare,
  type BusSchedule,
  type BusShape,
  type BusStation,
  type BusStopInfo,
  type BusStopOfRoute,
  type BusVehicle,
  TdxApiError,
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
const stopEtaFixture = loadFixture('bus-eta-stop-taipei.json') as BusEstimatedTimeOfArrival[];
const scheduleFixture = loadFixture('bus-schedule-taipei-307.json') as BusSchedule[];
const coachScheduleFixture = loadFixture('bus-schedule-intercity-1610.json') as BusSchedule[];
const alertFixture = loadFixture('bus-alert-taipei.json') as BusAlert[];
const coachAlertFixture = loadFixture('bus-alert-intercity.json') as BusAlert[];
const newsFixture = loadFixture('bus-news-taipei.json') as BusNews[];
const positionsFixture = loadFixture('bus-position-taipei-307.json') as BusPosition[];
const interCityRouteFixture = loadFixture('bus-intercity-route-1610.json') as BusRoute[];
const interCityEtaFixture = loadFixture(
  'bus-intercity-eta-1610.json',
) as BusEstimatedTimeOfArrival[];

const nearStopFixture = loadFixture('bus-near-stop-taipei-307.json') as BusNearStop[];
const coachNearStopFixture = loadFixture('bus-intercity-near-stop-1610.json') as BusNearStop[];
const shapeFixture = loadFixture('bus-shape-taipei-307.json') as BusShape[];
const operatorFixture = loadFixture('bus-operator-taipei.json') as BusOperator[];
const coachOperatorFixture = loadFixture('bus-operator-intercity.json') as BusOperator[];
const vehicleFixture = loadFixture('bus-vehicle-taipei.json') as BusVehicle[];
const fareFixture = loadFixture('bus-route-fare-taipei-307.json') as BusRouteFare[];
const coachFareFixture = loadFixture('bus-intercity-route-fare-1610.json') as BusRouteFare[];
const firstLastFixture = loadFixture('bus-first-last-taichung.json') as BusFirstLastTripInfo[];
const coachFirstLastFixture = loadFixture(
  'bus-first-last-intercity.json',
) as BusFirstLastTripInfo[];
const displayStopsFixture = loadFixture(
  'bus-display-stop-taipei-307.json',
) as BusDisplayStopOfRoute[];

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

describe('tdx.bus.eta without a route', () => {
  it('requests every arrival in a city or of every coach route, with a stop filter', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.bus.eta('Taipei', { filter: "StopUID eq 'TPE34726'" });
    await tdx.bus.interCity.eta({ filter: "StopUID eq 'THB289792'" });
    await tdx.bus.interCity.eta();

    expect(decoded(apiUrls)).toEqual([
      `${API}/v2/Bus/EstimatedTimeOfArrival/City/Taipei?$filter=StopUID eq 'TPE34726'&$format=JSON`,
      `${API}/v2/Bus/EstimatedTimeOfArrival/InterCity?$filter=StopUID eq 'THB289792'&$format=JSON`,
      `${API}/v2/Bus/EstimatedTimeOfArrival/InterCity?$format=JSON`,
    ]);
  });

  it('parses the arrivals of every route at a stop', async () => {
    const { tdx } = clientWithResponse(stopEtaFixture);

    const etas = await tdx.bus.eta('Taipei', { filter: "StopUID eq 'TPE34726'" });

    expect(etas.map((e) => [e.StopUID, e.RouteName?.Zh_tw])).toEqual([
      ['TPE34726', '205'],
      ['TPE35854', '221'],
    ]);
  });
});

describe('tdx.bus.schedule', () => {
  it('requests a route schedule by exact name, or every schedule', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.bus.schedule('Taipei', '307');
    await tdx.bus.schedule('Taipei', { top: 1 });
    await tdx.bus.interCity.schedule('1610');
    await tdx.bus.interCity.schedule();

    expect(decoded(apiUrls)).toEqual([
      `${API}/v2/Bus/Schedule/City/Taipei/307?$filter=RouteName/Zh_tw eq '307'&$format=JSON`,
      `${API}/v2/Bus/Schedule/City/Taipei?$top=1&$format=JSON`,
      `${API}/v2/Bus/Schedule/InterCity/1610?$filter=RouteName/Zh_tw eq '1610'&$format=JSON`,
      `${API}/v2/Bus/Schedule/InterCity?$format=JSON`,
    ]);
    expect(() => tdx.bus.schedule('Taipei', ' ')).toThrow(TypeError);
  });

  it('parses headway bands and fixed trips', async () => {
    const city = clientWithResponse(scheduleFixture);
    const [route] = await city.tdx.bus.schedule('Taipei', '307');
    expectTypeOf(route).toEqualTypeOf<BusSchedule | undefined>();
    expect(route?.Timetables).toBeUndefined();
    const band = route?.Frequencys?.[0];
    expect(band?.StartTime).toMatch(/^\d\d:\d\d$/);
    expect(typeof band?.MinHeadwayMins).toBe('number');
    expect(route?.Frequencys?.[0]?.ServiceDay?.NationalHolidays).toBeUndefined();

    const coach = clientWithResponse(coachScheduleFixture);
    const [line] = await coach.tdx.bus.interCity.schedule('1610');
    expect(line?.OperatorID).toBeTruthy();
    const firstStop = line?.Timetables?.[0]?.StopTimes[0];
    expect(firstStop?.StopSequence).toBe(1);
    expect(firstStop?.DepartureTime).toMatch(/^\d\d:\d\d$/);
  });
});

describe('tdx.bus.alerts and news', () => {
  it('requests city and coach alerts and news', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.bus.alerts('Taipei');
    await tdx.bus.news('NewTaipei', { top: 5 });
    await tdx.bus.interCity.alerts();
    await tdx.bus.interCity.news();

    expect(decoded(apiUrls)).toEqual([
      `${API}/v2/Bus/Alert/City/Taipei?$format=JSON`,
      `${API}/v2/Bus/News/City/NewTaipei?$top=5&$format=JSON`,
      `${API}/v2/Bus/Alert/InterCity?$format=JSON`,
      `${API}/v2/Bus/News/InterCity?$format=JSON`,
    ]);
    expect(() => tdx.bus.alerts('')).toThrow(TypeError);
  });

  it('parses alerts with their scope, and news', async () => {
    const city = clientWithResponse(alertFixture);
    const [alert] = await city.tdx.bus.alerts('Taipei');
    expect(alert).toMatchObject({ Status: 2, Department: '臺北市公共運輸處' });
    expect(alert?.Scope.Stops?.length).toBeGreaterThan(0);

    const coach = clientWithResponse(coachAlertFixture);
    const [coachAlert] = await coach.tdx.bus.interCity.alerts();
    expect(coachAlert?.Scope.Operators?.[0]?.OperatorName?.Zh_tw).toBeTruthy();

    const news = clientWithResponse(newsFixture);
    const [item] = await news.tdx.bus.news('Taipei');
    expect(item?.Title).toBeTruthy();
    expect(item?.ContactPhone).toBe('');
  });
});

describe('tdx.bus.nearStop', () => {
  it('requests the A2 data of one route by exact name, or of every route', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.bus.nearStop('Taipei', '307');
    await tdx.bus.nearStop('Taipei', '307', { exact: false });
    await tdx.bus.nearStop('Taipei', { filter: "PlateNumb eq '208-U5'" });
    await tdx.bus.interCity.nearStop('1610');
    await tdx.bus.interCity.nearStop();

    expect(decoded(apiUrls)).toEqual([
      `${API}/v2/Bus/RealTimeNearStop/City/Taipei/307?$filter=RouteName/Zh_tw eq '307'&$format=JSON`,
      `${API}/v2/Bus/RealTimeNearStop/City/Taipei/307?$format=JSON`,
      `${API}/v2/Bus/RealTimeNearStop/City/Taipei?$filter=PlateNumb eq '208-U5'&$format=JSON`,
      `${API}/v2/Bus/RealTimeNearStop/InterCity/1610?$filter=RouteName/Zh_tw eq '1610'&$format=JSON`,
      `${API}/v2/Bus/RealTimeNearStop/InterCity?$format=JSON`,
    ]);
    expect(() => tdx.bus.nearStop('Taipei', ' ')).toThrow(TypeError);
    expect(() => tdx.bus.nearStop('', '307')).toThrow(TypeError);
  });

  it('parses city and coach arrivals at stops', async () => {
    const city = clientWithResponse(nearStopFixture);
    const vehicles = await city.tdx.bus.nearStop('Taipei', '307');
    expectTypeOf(vehicles).toEqualTypeOf<BusNearStop[]>();
    expect(vehicles[0]).toMatchObject({ RouteName: { Zh_tw: '307' }, Direction: 1 });
    expect(vehicles[0]?.StopName?.Zh_tw).toBeTruthy();
    expect([0, 1]).toContain(vehicles[0]?.A2EventType);
    expect(vehicles[0]?.SrcUpdateTime).toBeTruthy();
    expect(vehicles[0]?.MessageType).toBeUndefined();

    const coach = clientWithResponse(coachNearStopFixture);
    const [bus] = await coach.tdx.bus.interCity.nearStop('1610');
    expect(bus?.RouteName?.Zh_tw).toBe('1610');
    expect(bus?.SrcTransTime).toBeTruthy();
    expect(bus?.SrcUpdateTime).toBeUndefined();
  });

  it('rejects a response that is not an array', async () => {
    const { tdx } = clientWithResponse({ message: 'nope' });

    await expect(tdx.bus.nearStop('Taipei', '307')).rejects.toBeInstanceOf(TdxApiError);
  });
});

describe('tdx.bus.shapes', () => {
  it('requests the shapes of one route by exact name, or of every route', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.bus.shapes('Taipei', '307');
    await tdx.bus.shapes('Taipei', { select: ['RouteUID', 'Geometry'] });
    await tdx.bus.interCity.shapes('1610');
    await tdx.bus.interCity.shapes({ top: 1 });

    expect(decoded(apiUrls)).toEqual([
      `${API}/v2/Bus/Shape/City/Taipei/307?$filter=RouteName/Zh_tw eq '307'&$format=JSON`,
      `${API}/v2/Bus/Shape/City/Taipei?$select=RouteUID,Geometry&$format=JSON`,
      `${API}/v2/Bus/Shape/InterCity/1610?$filter=RouteName/Zh_tw eq '1610'&$format=JSON`,
      `${API}/v2/Bus/Shape/InterCity?$top=1&$format=JSON`,
    ]);
    expect(() => tdx.bus.interCity.shapes(' ')).toThrow(TypeError);
  });

  it('parses a shape without a sub-route', async () => {
    const { tdx } = clientWithResponse(shapeFixture);

    const [shape] = await tdx.bus.shapes('Taipei', '307');

    expect(shape?.RouteUID).toBe('TPE16111');
    expect(shape?.Geometry).toMatch(/^LINESTRING/);
    expect(shape?.EncodedPolyline.length).toBeGreaterThan(0);
    expect(shape?.SubRouteUID).toBeUndefined();
    expect(shape?.SubRouteName).toEqual({});
  });
});

describe('tdx.bus.operators and vehicles', () => {
  it('requests city and coach operators and a city fleet', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.bus.operators('Taipei');
    await tdx.bus.interCity.operators({ top: 5 });
    await tdx.bus.vehicles('Taipei', { filter: "PlateNumb eq '208-U5'" });

    expect(decoded(apiUrls)).toEqual([
      `${API}/v2/Bus/Operator/City/Taipei?$format=JSON`,
      `${API}/v2/Bus/Operator/InterCity?$top=5&$format=JSON`,
      `${API}/v2/Bus/Vehicle/City/Taipei?$filter=PlateNumb eq '208-U5'&$format=JSON`,
    ]);
    expect(() => tdx.bus.operators(' ')).toThrow(TypeError);
    expect(() => tdx.bus.vehicles('')).toThrow(TypeError);
  });

  it('parses operators, including the empty coach operator code', async () => {
    const city = clientWithResponse(operatorFixture);
    const [operator] = await city.tdx.bus.operators('Taipei');
    expect(operator?.AuthorityCode).toBe('TPE');
    expect(operator?.OperatorName.Zh_tw).toBeTruthy();

    const coach = clientWithResponse(coachOperatorFixture);
    const operators = await coach.tdx.bus.interCity.operators();
    expect(operators.every((o) => o.AuthorityCode === 'THB')).toBe(true);
    expect(operators.some((o) => o.OperatorCode === '')).toBe(true);
    expect(operators[0]?.SubAuthorityCode).toBeTruthy();
  });

  it('parses vehicles', async () => {
    const { tdx } = clientWithResponse(vehicleFixture);

    const vehicles = await tdx.bus.vehicles('Taipei');
    expectTypeOf(vehicles).toEqualTypeOf<BusVehicle[]>();

    expect(vehicles).toHaveLength(2);
    expect(vehicles[0]?.PlateNumb).toBeTruthy();
    expect([0, 1]).toContain(vehicles[0]?.IsLowFloor);
    expect([-1, 0, 1]).toContain(vehicles[0]?.HasWifi);
  });
});

describe('tdx.bus.fares', () => {
  it('matches the plain-string route name exactly', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.bus.fares('Taipei', '307');
    await tdx.bus.fares('Taipei', '307', { exact: false });
    await tdx.bus.fares('Taipei', query<BusRouteFare>().top(1));
    await tdx.bus.interCity.fares('1610');
    await tdx.bus.interCity.fares();

    expect(decoded(apiUrls)).toEqual([
      `${API}/v2/Bus/RouteFare/City/Taipei/307?$filter=RouteName eq '307'&$format=JSON`,
      `${API}/v2/Bus/RouteFare/City/Taipei/307?$format=JSON`,
      `${API}/v2/Bus/RouteFare/City/Taipei?$top=1&$format=JSON`,
      `${API}/v2/Bus/RouteFare/InterCity/1610?$filter=RouteName eq '1610'&$format=JSON`,
      `${API}/v2/Bus/RouteFare/InterCity?$format=JSON`,
    ]);
    expect(() => tdx.bus.fares('Taipei', '')).toThrow(TypeError);
  });

  it('parses section fares and stage fares', async () => {
    const city = clientWithResponse(fareFixture);
    const [fare] = await city.tdx.bus.fares('Taipei', '307');
    expect(fare).toMatchObject({ RouteName: '307', FarePricingType: 0, IsFreeBus: 0 });
    const section = fare?.SectionFares?.[0];
    expect(section?.BufferZones?.[0]?.FareBufferZoneOrigin.StopName).toBeTruthy();
    expect(section?.Fares.find((f) => f.TicketType === 1 && f.FareClass === 1)?.Price).toBe(15);

    const coach = clientWithResponse(coachFareFixture);
    const [coachFare] = await coach.tdx.bus.interCity.fares('1610');
    expect(coachFare?.FarePricingType).toBe(2);
    const stage = coachFare?.StageFares?.[0];
    expect(stage?.OriginStage.StopName).toBe('中港轉運站');
    expect(stage?.Fares[0]?.FareName).toBeTruthy();
  });
});

describe('tdx.bus.firstLastTrips', () => {
  it('requests first and last trips by exact route name, or every route', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.bus.firstLastTrips('Taichung', '300');
    await tdx.bus.firstLastTrips('Taichung');
    await tdx.bus.interCity.firstLastTrips({ filter: "RouteName/Zh_tw eq '1610'" });

    expect(decoded(apiUrls)).toEqual([
      `${API}/v2/Bus/FirstLastTripInfo/City/Taichung/300?$filter=RouteName/Zh_tw eq '300'&$format=JSON`,
      `${API}/v2/Bus/FirstLastTripInfo/City/Taichung?$format=JSON`,
      `${API}/v2/Bus/FirstLastTripInfo/InterCity?$filter=RouteName/Zh_tw eq '1610'&$format=JSON`,
    ]);
    expect(() => tdx.bus.firstLastTrips('Taichung', ' ')).toThrow(TypeError);
  });

  it('parses the first and last trips per day type', async () => {
    const city = clientWithResponse(firstLastFixture);
    const [route] = await city.tdx.bus.firstLastTrips('Taichung');
    const [weekday, weekend] = route?.FirstLastTrips ?? [];
    expect(weekday).toMatchObject({ FirstTripDepTime: '06:30', LastTripDepTime: '22:00' });
    expect(weekday?.ServiceDay).toMatchObject({ Monday: 1, Saturday: 0 });
    expect(weekend?.ServiceDay).toMatchObject({ Sunday: 1, Saturday: 1 });
    expect(weekday?.ServiceDay.TyphoonDay).toBeUndefined();

    const coach = clientWithResponse(coachFirstLastFixture);
    const [coachRoute] = await coach.tdx.bus.interCity.firstLastTrips();
    expect(coachRoute?.FirstLastTrips[0]?.FirstTripDepTime).toMatch(/^\d\d:\d\d$/);
  });
});

describe('tdx.bus.displayStopsOfRoute', () => {
  it('requests the display stops of one route by exact name, or of every route', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.bus.displayStopsOfRoute('Taipei', '307');
    await tdx.bus.displayStopsOfRoute('Taipei', { top: 2 });

    expect(decoded(apiUrls)).toEqual([
      `${API}/v2/Bus/DisplayStopOfRoute/City/Taipei/307?$filter=RouteName/Zh_tw eq '307'&$format=JSON`,
      `${API}/v2/Bus/DisplayStopOfRoute/City/Taipei?$top=2&$format=JSON`,
    ]);
  });

  it('parses stops without a station group', async () => {
    const { tdx } = clientWithResponse(displayStopsFixture);

    const [route] = await tdx.bus.displayStopsOfRoute('Taipei', '307');

    expect(route?.Direction).toBe(0);
    expect(route?.Stops.map((s) => s.StopSequence)).toEqual([1, 2, 3]);
    expect(route?.Stops[0]?.StopPosition.PositionLat).toBeTypeOf('number');
    expect(route?.Stops[0]?.StationGroupID).toBeUndefined();
  });
});
