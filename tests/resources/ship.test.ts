import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  type ShipAlerts,
  type ShipAuthorities,
  type ShipDailySchedules,
  type ShipGeneralSchedule,
  type ShipGeneralSchedules,
  type ShipLiveBoard,
  type ShipLiveBoards,
  type ShipLivePositions,
  type ShipNewsList,
  type ShipOperators,
  type ShipPorts,
  type ShipRouteFare,
  type ShipRouteFares,
  type ShipRoutes,
  type ShipSeatAvailabilities,
  type ShipStopOfRoutes,
  type ShipVessels,
  TdxApiError,
  query,
} from '../../src/index.js';
import { API, clientWithResponse, loadFixture } from '../helpers.js';

const portsFixture = loadFixture('ship-port.json') as ShipPorts;
const routesFixture = loadFixture('ship-route.json') as ShipRoutes;
const penghuRoutesFixture = loadFixture('ship-route-penghu.json') as ShipRoutes;
const operatorsFixture = loadFixture('ship-operator.json') as ShipOperators;
const vesselsFixture = loadFixture('ship-vessel.json') as ShipVessels;
const stopsFixture = loadFixture('ship-stop-of-route.json') as ShipStopOfRoutes;
const faresFixture = loadFixture('ship-od-fare.json') as ShipRouteFares;
const faresBetweenFixture = loadFixture('ship-od-fare-between.json') as ShipRouteFare[];
const generalFixture = loadFixture('ship-general-schedule.json') as ShipGeneralSchedules;
const dailyFixture = loadFixture('ship-daily-schedule.json') as ShipDailySchedules;
const penghuDailyFixture = loadFixture('ship-daily-schedule-penghu.json') as ShipDailySchedules;
const liveBoardFixture = loadFixture('ship-live-board.json') as ShipLiveBoards;
const positionsFixture = loadFixture('ship-live-position.json') as ShipLivePositions;
const seatsFixture = loadFixture('ship-seat-availability.json') as ShipSeatAvailabilities;
const alertsFixture = loadFixture('ship-alert.json') as ShipAlerts;
const newsFixture = loadFixture('ship-news.json') as ShipNewsList;
const authoritiesFixture = loadFixture('ship-authority.json') as ShipAuthorities;

describe('tdx.ship paths', () => {
  it('requests each nationwide endpoint as JSON', async () => {
    const { tdx, apiUrls } = clientWithResponse({});

    await tdx.ship.ports();
    await tdx.ship.routes();
    await tdx.ship.operators();
    await tdx.ship.vessels();
    await tdx.ship.stopsOfRoute();
    await tdx.ship.odFare();
    await tdx.ship.generalSchedule();
    await tdx.ship.generalSchedule('FGGI');
    await tdx.ship.dailySchedule();
    await tdx.ship.dailySchedule('FGGI');
    await tdx.ship.liveBoard();
    await tdx.ship.livePosition();
    await tdx.ship.seatAvailability();
    await tdx.ship.alerts();
    await tdx.ship.news();
    await tdx.ship.authorities();

    expect(apiUrls).toEqual(
      [
        'Port',
        'Route',
        'Operator',
        'Vessel',
        'StopOfRoute',
        'ODFare',
        'GeneralSchedule',
        'GeneralSchedule/FGGI',
        'DailySchedule',
        'DailySchedule/FGGI',
        'ShipLiveBoard',
        'LivePosition',
        'SeatAvailability',
        'Alert',
        'News',
        'Authority',
      ].map((path) => `${API}/v3/Ship/${path}?$format=JSON`),
    );
  });

  it('requests each domestic city endpoint as JSON', async () => {
    const { tdx, apiUrls } = clientWithResponse({});

    await tdx.ship.domestic.routes('PenghuCounty');
    await tdx.ship.domestic.operators('PenghuCounty');
    await tdx.ship.domestic.vessels('PenghuCounty');
    await tdx.ship.domestic.stopsOfRoute('PenghuCounty');
    await tdx.ship.domestic.odFare('PenghuCounty');
    await tdx.ship.domestic.generalSchedule('PenghuCounty');
    await tdx.ship.domestic.generalSchedule('PenghuCounty', '2048');
    await tdx.ship.domestic.dailySchedule('PenghuCounty');
    await tdx.ship.domestic.dailySchedule('PenghuCounty', '2048');
    await tdx.ship.domestic.liveBoard('LienchiangCounty');
    await tdx.ship.domestic.alerts('PenghuCounty');
    await tdx.ship.domestic.news('PenghuCounty');

    expect(apiUrls).toEqual(
      [
        'Route/Domestic/City/PenghuCounty',
        'Operator/Domestic/City/PenghuCounty',
        'Vessel/Domestic/City/PenghuCounty',
        'StopOfRoute/Domestic/City/PenghuCounty',
        'ODFare/Domestic/City/PenghuCounty',
        'GeneralSchedule/Domestic/City/PenghuCounty',
        'GeneralSchedule/Domestic/City/PenghuCounty/2048',
        'DailySchedule/Domestic/City/PenghuCounty',
        'DailySchedule/Domestic/City/PenghuCounty/2048',
        'ShipLiveBoard/Domestic/City/LienchiangCounty',
        'Alert/Domestic/City/PenghuCounty',
        'News/Domestic/City/PenghuCounty',
      ].map((path) => `${API}/v3/Ship/${path}?$format=JSON`),
    );
  });

  it('requests fares between two ports from the array endpoint', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.ship.odFareBetween('TWKEL', 'TW007');

    expect(apiUrls).toEqual([`${API}/v3/Ship/ODFare/TWKEL/to/TW007?$format=JSON`]);
  });

  it('treats a first object argument as the query', async () => {
    const { tdx, apiUrls } = clientWithResponse({});

    await tdx.ship.dailySchedule({ top: 2 });
    await tdx.ship.generalSchedule(query<ShipGeneralSchedule>().top(1));
    await tdx.ship.domestic.dailySchedule('PenghuCounty', { top: 3 });

    expect(apiUrls).toEqual([
      `${API}/v3/Ship/DailySchedule?$top=2&$format=JSON`,
      `${API}/v3/Ship/GeneralSchedule?$top=1&$format=JSON`,
      `${API}/v3/Ship/DailySchedule/Domestic/City/PenghuCounty?$top=3&$format=JSON`,
    ]);
  });

  it('passes OData queries through', async () => {
    const { tdx, apiUrls } = clientWithResponse({});

    await tdx.ship.routes({ filter: 'RouteType eq 2', select: ['RouteID', 'RouteName'] });
    await tdx.ship.liveBoard(query<ShipLiveBoard>().filter("PortID eq 'TW001'"));

    expect(apiUrls.map((u) => decodeURIComponent(u))).toEqual([
      `${API}/v3/Ship/Route?$select=RouteID,RouteName&$filter=RouteType eq 2&$format=JSON`,
      `${API}/v3/Ship/ShipLiveBoard?$filter=PortID eq 'TW001'&$format=JSON`,
    ]);
  });

  it('validates path segments', () => {
    const { tdx } = clientWithResponse({});

    expect(() => tdx.ship.generalSchedule('')).toThrow(TypeError);
    expect(() => tdx.ship.dailySchedule(' ')).toThrow(TypeError);
    expect(() => tdx.ship.odFareBetween('', 'TW007')).toThrow(TypeError);
    expect(() => tdx.ship.odFareBetween('TWKEL', ' ')).toThrow(TypeError);
    expect(() => tdx.ship.domestic.routes('')).toThrow(TypeError);
    expect(() => tdx.ship.domestic.dailySchedule('PenghuCounty', '')).toThrow(TypeError);
  });

  it('rejects the wrong JSON shape', async () => {
    const objects = clientWithResponse([]).tdx;
    const lists = clientWithResponse({}).tdx;

    await expect(objects.ship.ports()).rejects.toBeInstanceOf(TdxApiError);
    await expect(objects.ship.domestic.routes('PenghuCounty')).rejects.toBeInstanceOf(TdxApiError);
    await expect(lists.ship.odFareBetween('TWKEL', 'TW007')).rejects.toBeInstanceOf(TdxApiError);
  });
});

describe('tdx.ship parsing', () => {
  it('parses ports with the static header and without the country the spec requires', async () => {
    const { tdx } = clientWithResponse(portsFixture);

    const ports = await tdx.ship.ports();
    expectTypeOf(ports).toEqualTypeOf<ShipPorts>();

    expect([ports.AuthorityCode, ports.VersionID, ports.Count]).toEqual(['MPB', 4443, undefined]);
    expect(ports.Ports.map((p) => [p.PortID, p.PortName.Zh_tw, p.City, p.CityCode])).toEqual([
      ['TWMZG', '澎湖港馬公碼頭區', '澎湖縣', 'PEN'],
      ['TW001', '小琉球白沙港', '屏東縣', 'PIF'],
      ['TWKEL', '基隆港', '基隆市', 'KEE'],
    ]);
    expect(ports.Ports[0]?.Country).toBeUndefined();
    expect(ports.Ports[0]?.PortPosition.PositionLat).toEqual(expect.any(Number));
  });

  it('parses nationwide and county routes', async () => {
    const national = await clientWithResponse(routesFixture).tdx.ship.routes();
    const penghu =
      await clientWithResponse(penghuRoutesFixture).tdx.ship.domestic.routes('PenghuCounty');
    expectTypeOf(national).toEqualTypeOf<ShipRoutes>();
    expectTypeOf(penghu).toEqualTypeOf<ShipRoutes>();

    expect(
      national.Routes.map((r) => [
        r.RouteID,
        r.RouteType,
        r.StartPortID,
        r.EndPortID,
        r.ServiceStatus,
      ]),
    ).toEqual([
      ['FGGI', 2, 'TWTTT', 'TWGNI', 1],
      ['KLMT', 2, 'TWKEL', 'TW007', 1],
    ]);
    expect(national.Routes[0]?.Vessels?.length).toBeGreaterThan(0);
    expect(penghu.AuthorityCode).toBe('PEN');
    expect(penghu.Routes.map((r) => [r.RouteID, r.RouteName.Zh_tw])).toEqual([
      ['2048', '望安-將軍-馬公'],
      ['2041', '重光漁港-大倉漁港'],
    ]);
  });

  it('parses operators, vessels and stop sequences', async () => {
    const operators = await clientWithResponse(operatorsFixture).tdx.ship.operators();
    const vessels = await clientWithResponse(vesselsFixture).tdx.ship.vessels();
    const stops = await clientWithResponse(stopsFixture).tdx.ship.stopsOfRoute();
    expectTypeOf(operators).toEqualTypeOf<ShipOperators>();
    expectTypeOf(vessels).toEqualTypeOf<ShipVessels>();
    expectTypeOf(stops).toEqualTypeOf<ShipStopOfRoutes>();

    expect(operators.Operators[0]).toMatchObject({
      OperatorID: 'MPBETMAC22979327',
      BusinessAdminstrationNo: '22979327',
    });
    expect(vessels.Vessels.map((v) => [v.VesselID, v.MMSI, v.MaxPassengerCount])).toEqual([
      ['015785', '416005255', 280],
      [expect.any(String), expect.any(String), expect.any(Number)],
    ]);
    expect(stops.StopOfRoutes[0]?.RouteID).toBe('FGGI');
    expect(stops.StopOfRoutes[0]?.Stops.map((s) => [s.StopSequence, s.PortID])).toEqual([
      [1, 'TWTTT'],
      [2, 'TWGNI'],
    ]);
  });

  it('parses fares, including the array endpoint between two ports', async () => {
    const fares = await clientWithResponse(faresFixture).tdx.ship.odFare();
    const between = await clientWithResponse(faresBetweenFixture).tdx.ship.odFareBetween(
      'TWKEL',
      'TW007',
    );
    expectTypeOf(fares).toEqualTypeOf<ShipRouteFares>();
    expectTypeOf(between).toEqualTypeOf<ShipRouteFare[]>();

    const od = fares.RouteFares[0]?.ODFares[0];
    expect([
      fares.RouteFares[0]?.RouteID,
      od?.OriginPort?.PortID,
      od?.DestinationPort?.PortID,
    ]).toEqual(['FGGI', 'TWTTT', 'TWGNI']);
    // FareClass 254 (其他) is outside the spec's 1-9.
    expect(od?.Fares[0]).toEqual({
      FareName: '天王星',
      TicketType: 1,
      FareClass: 254,
      CabinClass: '保險票不占位',
      Price: 100,
    });

    expect(between[0]?.RouteID).toBe('KLMT');
    const keelungToNangan = between[0]?.ODFares.find(
      (f) => f.OriginPort?.PortID === 'TWKEL' && f.DestinationPort?.PortID === 'TW007',
    );
    expect(keelungToNangan?.Fares.map((f) => [f.FareClass, f.Price])).toContainEqual([1, 1890]);
  });

  it('parses regular and daily timetables, with unpadded times and the city date format', async () => {
    const general = await clientWithResponse(generalFixture).tdx.ship.generalSchedule('BGHQ');
    const daily = await clientWithResponse(dailyFixture).tdx.ship.dailySchedule('CKJB');
    const penghu =
      await clientWithResponse(penghuDailyFixture).tdx.ship.domestic.dailySchedule('PenghuCounty');
    expectTypeOf(general).toEqualTypeOf<ShipGeneralSchedules>();
    expectTypeOf(daily).toEqualTypeOf<ShipDailySchedules>();

    const trip = general.GeneralSchedules[0]?.TimeTables?.[0];
    expect(general.GeneralSchedules[0]?.RouteID).toBe('BGHQ');
    expect(trip?.ServiceDay).toMatchObject({ Monday: 1, Sunday: 1, NationalHolidays: 0 });
    expect(trip?.StopTimes[0]).toMatchObject({ PortID: 'TW008', DepartureTime: '15:00' });

    const first = daily.DailySchedules[0];
    expect([first?.RouteID, first?.Date, first?.Direction]).toEqual(['CKJB', '2026-11-17', 0]);
    const stops = first?.TimeTables?.[0]?.StopTimes ?? [];
    expect(stops).toHaveLength(7); // a day of shuttling between the two ports
    expect(stops.slice(0, 3).map((s) => [s.PortID, s.ArrivalTime, s.DepartureTime])).toEqual([
      ['TW028', '', '6:15'],
      ['TW027', '6:35', '7:00'],
      ['TW028', '7:20', '11:15'],
    ]);
    expect(stops[6]?.DepartureTime).toBe('');
    expect(penghu.DailySchedules[0]?.Date).toBe('2026/11/27');
    expect(penghu.AuthorityCode).toBe('PEN');
  });

  it('parses a port live board with its oddly named array and ZhTw port names', async () => {
    const { tdx } = clientWithResponse(liveBoardFixture);

    const boards = await tdx.ship.liveBoard();
    expectTypeOf(boards).toEqualTypeOf<ShipLiveBoards>();

    const board = boards.ShipLiveBoardses[0];
    expect([board?.PortID, board?.PortName?.ZhTw, board?.ShipDate]).toEqual([
      'TW001',
      '小琉球白沙港',
      '2026-10-21T00:00:00+08:00',
    ]);
    expect(
      board?.DepartureLiveBoards?.map((d) => [
        d.VesselName?.Zh_tw,
        d.ArrivalPortName?.ZhTw,
        d.ScheduledDepartureTime,
        d.ActualDepartureTime,
        d.DepartureRemark,
      ]),
    ).toEqual([
      ['藍白3號', '東港', '2026-10-21T11:10:00+08:00', '2026-10-21T12:53:30+08:00', '離港'],
      ['翔信', '東港', '2026-10-21T07:40:00+08:00', undefined, '準時'],
    ]);
    expect(board?.ArrivalLiveBoards?.map((a) => [a.DeparturePortID, a.ArrivalRemark])).toEqual([
      ['TWDNK', '準時'],
      ['TWDNK', '準時'],
    ]);
  });

  it('parses AIS positions and seat availability', async () => {
    const positions = await clientWithResponse(positionsFixture).tdx.ship.livePosition();
    const seats = await clientWithResponse(seatsFixture).tdx.ship.seatAvailability();
    expectTypeOf(positions).toEqualTypeOf<ShipLivePositions>();
    expectTypeOf(seats).toEqualTypeOf<ShipSeatAvailabilities>();

    expect(positions.LivePositions[0]).toMatchObject({
      MMSI: '416009193',
      NAVSTAT: 5,
      VesselType: 60,
      VesselPosition: { PositionLat: 25.1343117, PositionLon: 121.74133 },
    });
    expect(positions.LivePositions[0]?.VesselName?.Zh_tw).toBe('');

    const sailing = seats.SeatAvailabilities[0]?.Availabilities?.[0];
    expect(seats.SeatAvailabilities[0]?.RouteID).toBe('KMQZ');
    expect(sailing).toMatchObject({
      TotalSeats: 238,
      BookedSeats: 12,
      SeatStatus: 5,
      ShipStatus: 2,
    });
    expect(sailing?.CabinSeats?.[0]?.CabinClass).toBe('普通艙');
  });

  it('parses alerts, empty news and authorities', async () => {
    const alerts = await clientWithResponse(alertsFixture).tdx.ship.alerts();
    const news = await clientWithResponse(newsFixture).tdx.ship.news();
    const authorities = await clientWithResponse(authoritiesFixture).tdx.ship.authorities();
    expectTypeOf(alerts).toEqualTypeOf<ShipAlerts>();
    expectTypeOf(news).toEqualTypeOf<ShipNewsList>();
    expectTypeOf(authorities).toEqualTypeOf<ShipAuthorities>();

    const alert = alerts.Alerts[0];
    expect([alert?.Status, alert?.Level, alert?.Effect, alert?.Cause]).toEqual([2, 1, 4, '天災']);
    expect(alert?.Scope?.Routes?.[0]?.RouteID).toBe('FGGI');
    expect(news.Newses).toEqual([]);
    expect(authorities.Authorities.map((a) => a.AuthorityCode)).toEqual(['TIPC', 'NWT', 'NAN']);
  });
});
