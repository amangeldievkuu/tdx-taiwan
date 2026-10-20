import type {
  ThsrAlert,
  ThsrAvailableSeat,
  ThsrAvailableSeats,
  ThsrODFare,
  ThsrODTimetable,
  ThsrStation,
  ThsrStationId,
} from '../types/thsr.js';
import {
  type ListRequester,
  type ObjectRequester,
  type QueryInput,
  segment,
  trainDate,
} from './requester.js';

/** Taiwan High Speed Rail (高鐵) endpoints. */
export class ThsrApi {
  constructor(
    private readonly list: ListRequester,
    private readonly object: ObjectRequester,
  ) {}

  /**
   * The 12 stations. Cached with the static TTL.
   * `GET /v2/Rail/THSR/Station`
   */
  stations(query?: QueryInput<ThsrStation>): Promise<ThsrStation[]> {
    return this.list('/v2/Rail/THSR/Station', query, 'static');
  }

  /**
   * Trains from one station to another on a day (default: today in Taiwan). TDX only serves
   * dates in its published window (about four weeks ahead); later dates fail with a 400.
   * Cached with the static TTL.
   * `GET /v2/Rail/THSR/DailyTimetable/OD/{OriginStationID}/to/{DestinationStationID}/{TrainDate}`
   *
   * @example tdx.thsr.timetable('1000', '1070', '2026-10-21') // Taipei → Zuoying
   */
  timetable(
    from: ThsrStationId,
    to: ThsrStationId,
    date?: Date | string,
    query?: QueryInput<ThsrODTimetable>,
  ): Promise<ThsrODTimetable[]> {
    const path =
      `/v2/Rail/THSR/DailyTimetable/OD/${segment(from, 'from')}/to/${segment(to, 'to')}` +
      `/${trainDate(date)}`;
    return this.list(path, query, 'static');
  }

  /**
   * Standard, business and non-reserved fares between two stations. Cached with the static TTL.
   * `GET /v2/Rail/THSR/ODFare/{OriginStationID}/to/{DestinationStationID}`
   */
  odFare(
    from: ThsrStationId,
    to: ThsrStationId,
    query?: QueryInput<ThsrODFare>,
  ): Promise<ThsrODFare[]> {
    const path = `/v2/Rail/THSR/ODFare/${segment(from, 'from')}/to/${segment(to, 'to')}`;
    return this.list(path, query, 'static');
  }

  /**
   * Remaining reserved seats on trains departing a station. The query applies to the
   * `AvailableSeats` items. Cached with the real-time TTL.
   * `GET /v2/Rail/THSR/AvailableSeatStatusList/{StationID}`
   */
  availableSeats(
    station: ThsrStationId,
    query?: QueryInput<ThsrAvailableSeat>,
  ): Promise<ThsrAvailableSeats> {
    return this.object(
      `/v2/Rail/THSR/AvailableSeatStatusList/${segment(station, 'station')}`,
      query,
      'realtime',
    );
  }

  /**
   * Current service alerts. Cached with the real-time TTL.
   * `GET /v2/Rail/THSR/AlertInfo`
   */
  alerts(query?: QueryInput<ThsrAlert>): Promise<ThsrAlert[]> {
    return this.list('/v2/Rail/THSR/AlertInfo', query, 'realtime');
  }
}
