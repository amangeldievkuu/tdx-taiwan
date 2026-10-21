import type {
  ParkingAvailabilities,
  ParkingAvailability,
  ParkingCarPark,
  ParkingCarParks,
  ParkingCity,
  ParkingSegment,
  ParkingSegmentAvailabilities,
  ParkingSegmentAvailability,
  ParkingSegments,
} from '../types/parking.js';
import { type ObjectRequester, type QueryInput, segment } from './requester.js';

/**
 * Parking (停車資訊) endpoints. Every response is a wrapper object; queries apply to the items
 * inside it. Coverage differs per city, and cities without data return an empty list.
 */
export class ParkingApi {
  constructor(private readonly object: ObjectRequester) {}

  /**
   * Off-street car parks of a city (not available for NewTaipei). Cached with the static TTL.
   * `GET /v1/Parking/OffStreet/CarPark/City/{City}`
   */
  carParks(city: ParkingCity, query?: QueryInput<ParkingCarPark>): Promise<ParkingCarParks> {
    return this.object(
      `/v1/Parking/OffStreet/CarPark/City/${segment(city, 'city')}`,
      query,
      'static',
    );
  }

  /**
   * Live free spaces in a city's car parks; join to `carParks` on `CarParkID`. Cached with the
   * real-time TTL. `GET /v1/Parking/OffStreet/ParkingAvailability/City/{City}`
   */
  availability(
    city: ParkingCity,
    query?: QueryInput<ParkingAvailability>,
  ): Promise<ParkingAvailabilities> {
    return this.object(
      `/v1/Parking/OffStreet/ParkingAvailability/City/${segment(city, 'city')}`,
      query,
      'realtime',
    );
  }

  /**
   * On-street (curbside) parking segments of a city. Cached with the static TTL.
   * `GET /v1/Parking/OnStreet/ParkingSegment/City/{City}`
   */
  segments(city: ParkingCity, query?: QueryInput<ParkingSegment>): Promise<ParkingSegments> {
    return this.object(
      `/v1/Parking/OnStreet/ParkingSegment/City/${segment(city, 'city')}`,
      query,
      'static',
    );
  }

  /**
   * Live free spaces in a city's on-street segments; join to `segments` on `ParkingSegmentID`.
   * Cached with the real-time TTL.
   * `GET /v1/Parking/OnStreet/ParkingSegmentAvailability/City/{City}`
   */
  segmentAvailability(
    city: ParkingCity,
    query?: QueryInput<ParkingSegmentAvailability>,
  ): Promise<ParkingSegmentAvailabilities> {
    return this.object(
      `/v1/Parking/OnStreet/ParkingSegmentAvailability/City/${segment(city, 'city')}`,
      query,
      'realtime',
    );
  }
}
