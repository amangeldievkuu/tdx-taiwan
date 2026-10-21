import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  type AirAirline,
  type AirAirport,
  type AirAirportBoard,
  type AirArrival,
  type AirDailyFlightSchedule,
  type AirDeparture,
  type AirFlight,
  type AirGeneralSchedule,
  type AirMetar,
  type AirNews,
  type AirRouteFare,
  type AirSeatAvailability,
  TdxApiError,
  query,
} from '../../src/index.js';
import { API, clientWithResponse, loadFixture } from '../helpers.js';

const airportsFixture = loadFixture('air-airport.json') as AirAirport[];
const airportFixture = loadFixture('air-airport-tpe.json') as AirAirport;
const airlinesFixture = loadFixture('air-airline.json') as AirAirline[];
const departuresFixture = loadFixture('air-fids-departure-tpe.json') as AirDeparture[];
const arrivalsFixture = loadFixture('air-fids-arrival-tpe.json') as AirArrival[];
const flightsFixture = loadFixture('air-fids-flight.json') as AirFlight[];
const boardFixture = loadFixture('air-fids-airport-tsa.json') as AirAirportBoard[];
const metarFixture = loadFixture('air-metar-tpe.json') as AirMetar[];
const generalFixture = loadFixture('air-general-schedule-domestic.json') as AirGeneralSchedule[];
const dailyFixture = loadFixture('air-daily-schedule-ae.json') as AirDailyFlightSchedule[];
const fareFixture = loadFixture('air-route-fare-ae.json') as AirRouteFare[];
const seatFixture = loadFixture('air-seat-availability-b7.json') as AirSeatAvailability[];
const newsFixture = loadFixture('air-news.json') as AirNews[];

describe('tdx.air paths', () => {
  it('requests each list endpoint as JSON, with and without the optional segment', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.air.airports();
    await tdx.air.airlines();
    await tdx.air.departures();
    await tdx.air.departures('TPE');
    await tdx.air.arrivals();
    await tdx.air.arrivals('TSA');
    await tdx.air.flights();
    await tdx.air.flights('100');
    await tdx.air.boards();
    await tdx.air.boards('KHH');

    expect(apiUrls).toEqual(
      [
        '/v2/Air/Airport',
        '/v2/Air/Airline',
        '/v2/Air/FIDS/Airport/Departure',
        '/v2/Air/FIDS/Airport/Departure/TPE',
        '/v2/Air/FIDS/Airport/Arrival',
        '/v2/Air/FIDS/Airport/Arrival/TSA',
        '/v2/Air/FIDS/Flight',
        '/v2/Air/FIDS/Flight/100',
        '/v2/Air/FIDS/Airport',
        '/v2/Air/FIDS/Airport/KHH',
      ].map((path) => `${API}${path}?$format=JSON`),
    );
  });

  it('requests the single-object endpoints as JSON', async () => {
    const { tdx, apiUrls } = clientWithResponse({});

    await tdx.air.airport('TPE');
    await tdx.air.airline('CI');

    expect(apiUrls).toEqual([
      `${API}/v2/Air/Airport/TPE?$format=JSON`,
      `${API}/v2/Air/Airline/CI?$format=JSON`,
    ]);
  });

  it('treats a first object argument as the query', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.air.departures({ top: 5 });
    await tdx.air.boards(query<AirAirportBoard>().top(1));

    expect(apiUrls).toEqual([
      `${API}/v2/Air/FIDS/Airport/Departure?$top=5&$format=JSON`,
      `${API}/v2/Air/FIDS/Airport?$top=1&$format=JSON`,
    ]);
  });

  it('passes OData queries through', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.air.departures('TPE', { filter: 'IsCargo eq true', top: 2 });
    await tdx.air.flights(
      '100',
      query<AirFlight>().filter("AirlineID eq 'CI'").orderBy('ScheduleDepartureTime'),
    );

    expect(apiUrls.map((u) => decodeURIComponent(u))).toEqual([
      `${API}/v2/Air/FIDS/Airport/Departure/TPE?$filter=IsCargo eq true&$top=2&$format=JSON`,
      `${API}/v2/Air/FIDS/Flight/100?$filter=AirlineID eq 'CI'&$orderby=ScheduleDepartureTime&$format=JSON`,
    ]);
  });

  it('validates path segments', () => {
    const { tdx } = clientWithResponse([]);

    expect(() => tdx.air.airport('')).toThrow(TypeError);
    expect(() => tdx.air.airline(' ')).toThrow(TypeError);
    expect(() => tdx.air.departures('')).toThrow(TypeError);
    expect(() => tdx.air.arrivals(' ')).toThrow(TypeError);
    expect(() => tdx.air.flights('')).toThrow(TypeError);
    expect(() => tdx.air.boards('')).toThrow(TypeError);
  });

  it('rejects the wrong JSON shape', async () => {
    const list = clientWithResponse({}).tdx;
    const object = clientWithResponse([]).tdx;

    await expect(list.air.departures('TSA')).rejects.toBeInstanceOf(TdxApiError);
    await expect(list.air.airports()).rejects.toBeInstanceOf(TdxApiError);
    await expect(object.air.airport('TPE')).rejects.toBeInstanceOf(TdxApiError);
    await expect(object.air.airline('CI')).rejects.toBeInstanceOf(TdxApiError);
  });
});

describe('tdx.air parsing', () => {
  it('parses airports, including the empty names and positions outside Taiwan', async () => {
    const { tdx } = clientWithResponse(airportsFixture);

    const airports = await tdx.air.airports();
    expectTypeOf(airports).toEqualTypeOf<AirAirport[]>();

    expect(airports.map((a) => [a.AirportID, a.AirportName.Zh_tw, a.AirportNationality])).toEqual([
      ['TPE', '桃園國際機場', 'TW'],
      ['TSA', '臺北松山國際機場', 'TW'],
      ['AAN', '艾因國際機場', 'AE'],
    ]);
    expect(airports[0]?.AirportPosition.PositionLat).toBeCloseTo(25.077, 3);
    expect(airports[2]?.AirportPosition).toEqual({});
    expect(airports[2]?.AirportCityName).toEqual({});
  });

  it('parses a single airport', async () => {
    const { tdx } = clientWithResponse(airportFixture);

    const tpe = await tdx.air.airport('TPE');
    expectTypeOf(tpe).toEqualTypeOf<AirAirport>();

    expect(tpe).toMatchObject({ AirportID: 'TPE', AirportICAO: 'RCTP', AuthorityID: 'CAA' });
    expect(tpe.AirportCityName).toEqual({});
  });

  it('parses airlines, including one without an ID', async () => {
    const { tdx } = clientWithResponse(airlinesFixture);

    const airlines = await tdx.air.airlines();
    expectTypeOf(airlines).toEqualTypeOf<AirAirline[]>();

    expect(airlines.map((a) => [a.AirlineID, a.AirlineName.En, a.AirlineICAO])).toEqual([
      ['CI', 'China Airlines', 'CAL'],
      ['', 'Executive Aviation Taiwan Corp.', undefined],
    ]);
    expect(airlines[1]?.AirlineNameAlias).toEqual({});
  });

  it('parses the departure board: passenger, cargo and cancelled rows', async () => {
    const { tdx } = clientWithResponse(departuresFixture);

    const departures = await tdx.air.departures('TPE');
    expectTypeOf(departures).toEqualTypeOf<AirDeparture[]>();

    expect(
      departures.map((d) => [
        d.AirlineID + d.FlightNumber,
        d.ArrivalAirportID,
        d.ScheduleDepartureTime,
        d.ActualDepartureTime,
        d.DepartureRemark,
        d.IsCargo,
      ]),
    ).toEqual([
      ['JX12', 'SFO', '2026-10-20T00:05', '2026-10-20T00:07', '出發DEPARTED', false],
      ['CI5895', 'CAN', '2026-10-20T01:35', '2026-10-20T02:14', '出發DEPARTED', true],
      ['NZ78', 'AKL', '2026-10-20T18:35', undefined, '取消CANCELLED', false],
    ]);
    expect(departures[0]).toMatchObject({ Gate: 'D12', CheckCounter: '9', AcType: 'A350-900' });
    expect(departures[1]?.Apron).toBe('509');
    expect(departures[1]?.Gate).toBeUndefined();
    expect(departures[2]?.Gate?.trim()).toBe('');
    for (const d of departures) {
      expect(d.ScheduleDepartureTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      expect(d.DepartureRemarkEn).toBeUndefined();
      expect(d.AirRouteType).toBeUndefined();
    }
  });

  it('parses the arrival board with baggage claims and a padded gate', async () => {
    const { tdx } = clientWithResponse(arrivalsFixture);

    const arrivals = await tdx.air.arrivals('TPE');
    expectTypeOf(arrivals).toEqualTypeOf<AirArrival[]>();

    expect(
      arrivals.map((a) => [
        a.AirlineID + a.FlightNumber,
        a.DepartureAirportID,
        a.BaggageClaim,
        a.Gate,
      ]),
    ).toEqual([
      ['KE5759', 'ICN', '01', ' A8'],
      ['LJ763', 'CJU', '04', ' A6'],
    ]);
    expect(arrivals[0]?.ArrivalRemark).toBe('已到ARRIVED');
  });

  it('parses a flight record with its route type', async () => {
    const { tdx } = clientWithResponse(flightsFixture);

    const [flight] = await tdx.air.flights('100');
    expectTypeOf(flight).toEqualTypeOf<AirFlight | undefined>();

    expect(flight).toMatchObject({
      AirlineID: 'CI',
      FlightNumber: '100',
      AirRouteType: 1,
      DepartureAirportID: 'TPE',
      ArrivalAirportID: 'NRT',
      DepartureTerminal: '2',
      DepartureGate: 'D9',
    });
    expect(flight?.FlightStatus).toBeUndefined();
  });

  it('parses an airport board as a one-element array', async () => {
    const { tdx } = clientWithResponse(boardFixture);

    const boards = await tdx.air.boards('TSA');
    expectTypeOf(boards).toEqualTypeOf<AirAirportBoard[]>();

    expect(boards).toHaveLength(1);
    expect(boards[0]?.AirportID).toBe('TSA');
    expect(boards[0]?.FIDSDeparture).toHaveLength(2);
    expect(boards[0]?.FIDSArrival).toHaveLength(2);
    expect(boards[0]?.FIDSDeparture[0]?.DepartureAirportID).toBe('TSA');
    expect(boards[0]?.FIDSArrival[0]?.ArrivalAirportID).toBe('TSA');
  });
});

describe('tdx.air weather, schedules, fares and news', () => {
  it('requests each endpoint as JSON', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.air.metar();
    await tdx.air.metar('TPE');
    await tdx.air.generalSchedule('Domestic');
    await tdx.air.generalSchedule('International', { top: 2 });
    await tdx.air.dailySchedule('AE');
    await tdx.air.routeFares('B7');
    await tdx.air.seatAvailability('AE', 'TSA-KNH', '2026-10-22', '1281');
    await tdx.air.seatAvailability('B7', 'CYI-KNH', new Date('2026-10-29T20:00:00Z'), '8901');
    await tdx.air.news();

    expect(apiUrls).toEqual(
      [
        '/METAR/Airport',
        '/METAR/Airport/TPE',
        '/GeneralSchedule/Domestic',
        '/GeneralSchedule/International?$top=2',
        '/DailyFlightSchedule/Domestic/AE',
        '/RouteFare/Domestic/B7',
        '/SeatAvailability/Domestic/AE/AirRoute/TSA-KNH/FlightDate/2026-10-22/FlightNumber/1281',
        '/SeatAvailability/Domestic/B7/AirRoute/CYI-KNH/FlightDate/2026-10-30/FlightNumber/8901',
        '/News',
      ].map((path) => `${API}/v2/Air${path}${path.includes('?') ? '&' : '?'}$format=JSON`),
    );
  });

  it('passes queries through and validates path segments', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.air.dailySchedule(
      'AE',
      query<AirDailyFlightSchedule>().filter("AirRouteID eq 'TSA-KNH'").top(3),
    );
    expect(decodeURIComponent(apiUrls[0] ?? '')).toBe(
      `${API}/v2/Air/DailyFlightSchedule/Domestic/AE?$filter=AirRouteID eq 'TSA-KNH'&$top=3&$format=JSON`,
    );

    expect(() => tdx.air.metar('')).toThrow(TypeError);
    expect(() => tdx.air.generalSchedule('')).toThrow(TypeError);
    expect(() => tdx.air.dailySchedule(' ')).toThrow(TypeError);
    expect(() => tdx.air.seatAvailability('AE', '', '2026-10-22', '1281')).toThrow(TypeError);
    expect(() => tdx.air.seatAvailability('AE', 'TSA-KNH', '2026/10/22', '1281')).toThrow(
      TypeError,
    );
    await expect(clientWithResponse({}).tdx.air.news()).rejects.toBeInstanceOf(TdxApiError);
  });

  it('parses a METAR observation with its unit strings', async () => {
    const { tdx } = clientWithResponse(metarFixture);

    const [tpe] = await tdx.air.metar('TPE');
    expectTypeOf(tpe).toEqualTypeOf<AirMetar | undefined>();

    expect(tpe).toMatchObject({
      AirportID: 'TPE',
      StationID: 'RCTP',
      WindSpeed: '25 KT',
      Temperature: '26°C',
      Visibility: '9999 M',
    });
    expect(tpe?.MetarText).toMatch(/^METAR RCTP /);
    expect(tpe?.CityName).toEqual({});
  });

  it('parses general and daily schedules', async () => {
    const general = await clientWithResponse(generalFixture).tdx.air.generalSchedule('Domestic');
    const daily = await clientWithResponse(dailyFixture).tdx.air.dailySchedule('AE');
    expectTypeOf(general).toEqualTypeOf<AirGeneralSchedule[]>();
    expectTypeOf(daily).toEqualTypeOf<AirDailyFlightSchedule[]>();

    expect(general.map((g) => [g.AirlineID, g.FlightNumber, g.DepartureTime, g.Monday])).toEqual([
      ['AE', 'AE1261', '06:40', true],
      ['DA', expect.stringMatching(/^DA\d{3,4}$/), expect.any(String), expect.any(Boolean)],
    ]);
    expect(general[0]?.CodeShare).toEqual([]);
    expect(daily.map((d) => [d.AirRouteID, d.FlightNumber, d.FlightRemark])).toEqual([
      ['KHH-KNH', '307', ''],
      ['HUN-KHH', '7932', 'X'],
    ]);
    expect(daily[0]?.DepartureAirport.AirportName.Zh_tw).toBe('高雄小港國際機場');
    expect(daily[0]?.IsCargo).toBeUndefined();
  });

  it('parses route fares, seat availability and news', async () => {
    const fares = await clientWithResponse(fareFixture).tdx.air.routeFares('AE');
    const seats = await clientWithResponse(seatFixture).tdx.air.seatAvailability(
      'B7',
      'CYI-KNH',
      '2026-10-30',
      '8901',
    );
    const news = await clientWithResponse(newsFixture).tdx.air.news();
    expectTypeOf(fares).toEqualTypeOf<AirRouteFare[]>();
    expectTypeOf(seats).toEqualTypeOf<AirSeatAvailability[]>();
    expectTypeOf(news).toEqualTypeOf<AirNews[]>();

    expect(fares[0]?.AirRouteID).toBe('HUN-KHH');
    expect(fares[0]?.Fares.find((f) => f.FareClass === 1)).toEqual({
      FareName: '全額票',
      TicketType: 1,
      FareClass: 1,
      Price: 2329,
    });
    expect(seats[0]).toMatchObject({ AirRouteID: 'CYI-KNH', FlightNumber: '8901', SeatStatus: 3 });
    expect(seats[0]?.TotalSeats).toBeUndefined();
    expect(news[0]).toMatchObject({ Department: '民用航空局', AirportID: '', NewsCategory: 2 });
  });
});
