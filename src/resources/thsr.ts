import type {
  ThsrAlert,
  ThsrAvailableSeat,
  ThsrAvailableSeats,
  ThsrDailyTimetable,
  ThsrGeneralTimetable,
  ThsrNews,
  ThsrODFare,
  ThsrODTimetable,
  ThsrStation,
  ThsrStationExit,
  ThsrStationId,
  ThsrStationTimetable,
  ThsrTrainDates,
} from '../types/thsr.js';
import {
  type ListRequester,
  type ObjectRequester,
  type QueryInput,
  optional,
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
   * Remaining reserved seats on trains departing a station, or at every station. The query
   * applies to the `AvailableSeats` items. Cached with the real-time TTL.
   * `GET /v2/Rail/THSR/AvailableSeatStatusList[/{StationID}]`
   */
  availableSeats(query?: QueryInput<ThsrAvailableSeat>): Promise<ThsrAvailableSeats>;
  availableSeats(
    station: ThsrStationId,
    query?: QueryInput<ThsrAvailableSeat>,
  ): Promise<ThsrAvailableSeats>;
  availableSeats(
    stationOrQuery?: ThsrStationId | QueryInput<ThsrAvailableSeat>,
    query?: QueryInput<ThsrAvailableSeat>,
  ): Promise<ThsrAvailableSeats> {
    const base = '/v2/Rail/THSR/AvailableSeatStatusList';
    return this.object(...optional(base, 'station', stationOrQuery, query), 'realtime');
  }

  /**
   * Current service alerts. Cached with the real-time TTL.
   * `GET /v2/Rail/THSR/AlertInfo`
   */
  alerts(query?: QueryInput<ThsrAlert>): Promise<ThsrAlert[]> {
    return this.list('/v2/Rail/THSR/AlertInfo', query, 'realtime');
  }
  /**
   * The regular timetable: every train's stops and weekdays, for all trains or one train number.
   * Cached with the static TTL. `GET /v2/Rail/THSR/GeneralTimetable[/TrainNo/{TrainNo}]`
   */
  generalTimetable(query?: QueryInput<ThsrGeneralTimetable>): Promise<ThsrGeneralTimetable[]>;
  generalTimetable(
    trainNo: string,
    query?: QueryInput<ThsrGeneralTimetable>,
  ): Promise<ThsrGeneralTimetable[]>;
  generalTimetable(
    trainNoOrQuery?: string | QueryInput<ThsrGeneralTimetable>,
    query?: QueryInput<ThsrGeneralTimetable>,
  ): Promise<ThsrGeneralTimetable[]> {
    const base = '/v2/Rail/THSR/GeneralTimetable';
    if (typeof trainNoOrQuery === 'string') {
      return this.list(`${base}/TrainNo/${segment(trainNoOrQuery, 'trainNo')}`, query, 'static');
    }
    return this.list(base, trainNoOrQuery ?? query, 'static');
  }

  /**
   * Every train's full stop list on a day (default: today in Taiwan). Cached with the static
   * TTL. `GET /v2/Rail/THSR/DailyTimetable/TrainDate/{TrainDate}`
   */
  dailyTimetable(
    date?: Date | string,
    query?: QueryInput<ThsrDailyTimetable>,
  ): Promise<ThsrDailyTimetable[]> {
    return this.list(`/v2/Rail/THSR/DailyTimetable/TrainDate/${trainDate(date)}`, query, 'static');
  }

  /**
   * One train's stop list on a day (default: today in Taiwan). Cached with the static TTL.
   * `GET /v2/Rail/THSR/DailyTimetable/TrainNo/{TrainNo}/TrainDate/{TrainDate}`
   */
  trainTimetable(
    trainNo: string,
    date?: Date | string,
    query?: QueryInput<ThsrDailyTimetable>,
  ): Promise<ThsrDailyTimetable[]> {
    const path = `/v2/Rail/THSR/DailyTimetable/TrainNo/${segment(trainNo, 'trainNo')}/TrainDate/${trainDate(date)}`;
    return this.list(path, query, 'static');
  }

  /**
   * Every train calling at a station on a day (default: today in Taiwan), with arrival and
   * departure times. Cached with the static TTL.
   * `GET /v2/Rail/THSR/DailyTimetable/Station/{StationID}/{TrainDate}`
   */
  stationTimetable(
    station: ThsrStationId,
    date?: Date | string,
    query?: QueryInput<ThsrStationTimetable>,
  ): Promise<ThsrStationTimetable[]> {
    const path = `/v2/Rail/THSR/DailyTimetable/Station/${segment(station, 'station')}/${trainDate(date)}`;
    return this.list(path, query, 'static');
  }

  /**
   * The dates the daily timetables cover (about four weeks). Cached with the static TTL.
   * `GET /v2/Rail/THSR/DailyTimetable/TrainDates`
   */
  trainDates(query?: QueryInput<ThsrTrainDates>): Promise<ThsrTrainDates> {
    return this.object('/v2/Rail/THSR/DailyTimetable/TrainDates', query, 'static');
  }

  /**
   * THSR news (`Description` is HTML). Cached with the real-time TTL. `GET /v2/Rail/THSR/News`
   */
  news(query?: QueryInput<ThsrNews>): Promise<ThsrNews[]> {
    return this.list('/v2/Rail/THSR/News', query, 'realtime');
  }

  /**
   * Station exits with position, address and accessibility flags. Cached with the static TTL.
   * `GET /v2/Rail/THSR/StationExit`
   */
  stationExits(query?: QueryInput<ThsrStationExit>): Promise<ThsrStationExit[]> {
    return this.list('/v2/Rail/THSR/StationExit', query, 'static');
  }
}
