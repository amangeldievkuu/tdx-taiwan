import type {
  AirAirline,
  AirAirport,
  AirAirportBoard,
  AirAirportId,
  AirArrival,
  AirDeparture,
  AirFlight,
} from '../types/air.js';
import {
  type ListRequester,
  type ObjectRequester,
  type QueryInput,
  optional,
  segment,
} from './requester.js';

/**
 * Air (航空) endpoints: airports, airlines and live flight boards (FIDS). Flight numbers are
 * digits only (`'100'`, not `'CI100'`); the airline is the separate `AirlineID` field. Flight
 * times are Taiwan local time without a UTC offset (`AirLocalDateTime`).
 */
export class AirApi {
  constructor(
    private readonly list: ListRequester,
    private readonly object: ObjectRequester,
  ) {}

  /**
   * Every airport TDX knows (469 worldwide). Only the Taiwan airports have a position, address
   * and phone; most others have an empty `AirportCityName`. Cached with the static TTL.
   * `GET /v2/Air/Airport`
   */
  airports(query?: QueryInput<AirAirport>): Promise<AirAirport[]> {
    return this.list('/v2/Air/Airport', query, 'static');
  }

  /**
   * One airport by IATA code. An unknown code fails with a 404 `TdxApiError`. Cached with the
   * static TTL. `GET /v2/Air/Airport/{IATA}`
   */
  airport(iata: AirAirportId): Promise<AirAirport> {
    return this.object(`/v2/Air/Airport/${segment(iata, 'iata')}`, undefined, 'static');
  }

  /**
   * Every airline TDX knows (about 850). Cached with the static TTL.
   * `GET /v2/Air/Airline`
   */
  airlines(query?: QueryInput<AirAirline>): Promise<AirAirline[]> {
    return this.list('/v2/Air/Airline', query, 'static');
  }

  /**
   * One airline by IATA code, e.g. `'CI'`. An unknown code fails with a 404 `TdxApiError`.
   * Cached with the static TTL. `GET /v2/Air/Airline/{IATA}`
   */
  airline(iata: string): Promise<AirAirline> {
    return this.object(`/v2/Air/Airline/${segment(iata, 'iata')}`, undefined, 'static');
  }

  /**
   * Live departure board, for one airport or for all. TPE lists yesterday, today and tomorrow
   * (about 2,000 rows); other airports list today. Cargo flights are included: filter with
   * `IsCargo eq false`. Cached with the real-time TTL.
   * `GET /v2/Air/FIDS/Airport/Departure[/{IATA}]`
   *
   * @example tdx.air.departures('TSA', { filter: 'IsCargo eq false', top: 20 })
   */
  departures(query?: QueryInput<AirDeparture>): Promise<AirDeparture[]>;
  departures(airport: AirAirportId, query?: QueryInput<AirDeparture>): Promise<AirDeparture[]>;
  departures(
    airportOrQuery?: AirAirportId | QueryInput<AirDeparture>,
    query?: QueryInput<AirDeparture>,
  ): Promise<AirDeparture[]> {
    const base = '/v2/Air/FIDS/Airport/Departure';
    return this.list(...optional(base, 'airport', airportOrQuery, query), 'realtime');
  }

  /**
   * Live arrival board, for one airport or for all. Same coverage as `departures`. Cached with
   * the real-time TTL. `GET /v2/Air/FIDS/Airport/Arrival[/{IATA}]`
   */
  arrivals(query?: QueryInput<AirArrival>): Promise<AirArrival[]>;
  arrivals(airport: AirAirportId, query?: QueryInput<AirArrival>): Promise<AirArrival[]>;
  arrivals(
    airportOrQuery?: AirAirportId | QueryInput<AirArrival>,
    query?: QueryInput<AirArrival>,
  ): Promise<AirArrival[]> {
    const base = '/v2/Air/FIDS/Airport/Arrival';
    return this.list(...optional(base, 'airport', airportOrQuery, query), 'realtime');
  }

  /**
   * Live flight records (departure and arrival legs together), for one flight number or for
   * all of today's flights. The number is digits only and is shared across airlines, so narrow
   * it with `AirlineID`. Cached with the real-time TTL. `GET /v2/Air/FIDS/Flight[/{FlightNo}]`
   *
   * @example tdx.air.flights('100', { filter: "AirlineID eq 'CI'" }) // CI100
   */
  flights(query?: QueryInput<AirFlight>): Promise<AirFlight[]>;
  flights(flightNo: string, query?: QueryInput<AirFlight>): Promise<AirFlight[]>;
  flights(
    flightNoOrQuery?: string | QueryInput<AirFlight>,
    query?: QueryInput<AirFlight>,
  ): Promise<AirFlight[]> {
    const base = '/v2/Air/FIDS/Flight';
    return this.list(...optional(base, 'flightNo', flightNoOrQuery, query), 'realtime');
  }

  /**
   * Departure and arrival boards grouped by airport: one element per airport, still an array
   * for a single `{IATA}`. The query applies to the airport elements, not the flights inside.
   * Cached with the real-time TTL. `GET /v2/Air/FIDS/Airport[/{IATA}]`
   */
  boards(query?: QueryInput<AirAirportBoard>): Promise<AirAirportBoard[]>;
  boards(airport: AirAirportId, query?: QueryInput<AirAirportBoard>): Promise<AirAirportBoard[]>;
  boards(
    airportOrQuery?: AirAirportId | QueryInput<AirAirportBoard>,
    query?: QueryInput<AirAirportBoard>,
  ): Promise<AirAirportBoard[]> {
    const base = '/v2/Air/FIDS/Airport';
    return this.list(...optional(base, 'airport', airportOrQuery, query), 'realtime');
  }
}
