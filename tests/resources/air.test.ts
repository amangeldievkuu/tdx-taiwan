import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  type AirAirline,
  type AirAirport,
  type AirAirportBoard,
  type AirArrival,
  type AirDeparture,
  type AirFlight,
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
