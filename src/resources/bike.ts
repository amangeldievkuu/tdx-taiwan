import type {
  BikeAvailability,
  BikeCity,
  BikeStation,
  CyclingCity,
  CyclingShape,
} from '../types/bike.js';
import { type ListRequester, type QueryInput, segment } from './requester.js';

/** Public bike (YouBike / Moovo) endpoints. */
export class BikeApi {
  constructor(private readonly list: ListRequester) {}

  /**
   * Rental stations in a city. Cached with the static TTL.
   * `GET /v2/Bike/Station/City/{City}`
   */
  stations(city: BikeCity, query?: QueryInput<BikeStation>): Promise<BikeStation[]> {
    return this.list(`/v2/Bike/Station/City/${segment(city, 'city')}`, query, 'static');
  }

  /**
   * Real-time bike and dock availability for every station in a city.
   * Cached with the real-time TTL.
   * `GET /v2/Bike/Availability/City/{City}`
   */
  availability(city: BikeCity, query?: QueryInput<BikeAvailability>): Promise<BikeAvailability[]> {
    return this.list(`/v2/Bike/Availability/City/${segment(city, 'city')}`, query, 'realtime');
  }

  /**
   * Cycle paths of a city with their geometry (WKT), length and end points. Cached with the
   * static TTL. `GET /v2/Cycling/Shape/City/{City}`
   */
  cyclingRoutes(city: CyclingCity, query?: QueryInput<CyclingShape>): Promise<CyclingShape[]> {
    return this.list(`/v2/Cycling/Shape/City/${segment(city, 'city')}`, query, 'static');
  }
}
