import type {
  ThsrAlert,
  ThsrAvailableSeat,
  ThsrAvailableSeats,
  ThsrDailyTimetable,
  ThsrFreeSeatingCar,
  ThsrFreeSeatingCars,
  ThsrGeneralTimetable,
  ThsrLegSeat,
  ThsrLegSeatStatus,
  ThsrNews,
  ThsrODFare,
  ThsrODSeat,
  ThsrODSeatStatus,
  ThsrODTimetable,
  ThsrShape,
  ThsrStation,
  ThsrStationExit,
  ThsrStationId,
  ThsrStationOfLine,
  ThsrStationTimetable,
  ThsrTrainDates,
  ThsrTrainInfo,
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
  /**
   * Seat status of every train leg by leg (each stop to the next) on a day (default: today in
   * Taiwan). Returns an object; the query applies to its `AvailableSeats`. Cached with the
   * real-time TTL. `GET /v2/Rail/THSR/AvailableSeatStatus/Train/Leg/TrainDate/{TrainDate}`
   */
  legSeatStatus(date?: Date | string, query?: QueryInput<ThsrLegSeat>): Promise<ThsrLegSeatStatus> {
    const path = `/v2/Rail/THSR/AvailableSeatStatus/Train/Leg/TrainDate/${trainDate(date)}`;
    return this.object(path, query, 'realtime');
  }

  /**
   * Seat status between an origin and a destination: every pair on a day, one pair, or one
   * pair and train. Dates default to today in Taiwan. Returns an object; the query applies to
   * its `AvailableSeats`. Cached with the real-time TTL.
   * `GET /v2/Rail/THSR/AvailableSeatStatus/Train/OD[/{O}/to/{D}]/TrainDate/{d}[/TrainNo/{n}]`
   */
  odSeatStatus(date?: Date | string, query?: QueryInput<ThsrODSeat>): Promise<ThsrODSeatStatus>;
  odSeatStatus(
    from: ThsrStationId,
    to: ThsrStationId,
    date?: Date | string,
    query?: QueryInput<ThsrODSeat>,
  ): Promise<ThsrODSeatStatus>;
  odSeatStatus(
    from: ThsrStationId,
    to: ThsrStationId,
    date: Date | string | undefined,
    trainNo: string,
    query?: QueryInput<ThsrODSeat>,
  ): Promise<ThsrODSeatStatus>;
  odSeatStatus(
    ...args:
      | [date?: Date | string, query?: QueryInput<ThsrODSeat>]
      | [from: string, to: string, date?: Date | string, query?: QueryInput<ThsrODSeat>]
      | [
          from: string,
          to: string,
          date: Date | string | undefined,
          trainNo: string,
          query?: QueryInput<ThsrODSeat>,
        ]
  ): Promise<ThsrODSeatStatus> {
    const base = '/v2/Rail/THSR/AvailableSeatStatus/Train/OD';
    if (typeof args[1] !== 'string') {
      const [date, query] = args as [Date | string | undefined, QueryInput<ThsrODSeat>?];
      return this.object(`${base}/TrainDate/${trainDate(date)}`, query, 'realtime');
    }
    const [from, to, date, trainNoOrQuery, query] = args as [
      string,
      string,
      Date | string | undefined,
      string | QueryInput<ThsrODSeat> | undefined,
      QueryInput<ThsrODSeat>?,
    ];
    let path = `${base}/${segment(from, 'from')}/to/${segment(to, 'to')}/TrainDate/${trainDate(date)}`;
    if (typeof trainNoOrQuery === 'string') {
      path += `/TrainNo/${segment(trainNoOrQuery, 'trainNo')}`;
      return this.object(path, query, 'realtime');
    }
    return this.object(path, trainNoOrQuery, 'realtime');
  }

  /**
   * Which cars are non-reserved (自由座) on each train of a day (default: today in Taiwan).
   * Returns an object; the query applies to its `FreeSeatingCars`. Cached with the static TTL.
   * `GET /v2/Rail/THSR/DailyFreeSeatingCar/TrainDate/{TrainDate}`
   */
  freeSeatingCars(
    date?: Date | string,
    query?: QueryInput<ThsrFreeSeatingCar>,
  ): Promise<ThsrFreeSeatingCars> {
    const path = `/v2/Rail/THSR/DailyFreeSeatingCar/TrainDate/${trainDate(date)}`;
    return this.object(path, query, 'static');
  }

  /**
   * The trains of a day without their stops: number, direction, ends. Pass a train number
   * first to get one train. Dates default to today in Taiwan. Cached with the static TTL.
   * `GET /v2/Rail/THSR/DailyTrainInfo[/TrainNo/{TrainNo}]/TrainDate/{TrainDate}`
   */
  dailyTrainInfo(date?: Date | string, query?: QueryInput<ThsrTrainInfo>): Promise<ThsrTrainInfo[]>;
  dailyTrainInfo(
    trainNo: string,
    date?: Date | string,
    query?: QueryInput<ThsrTrainInfo>,
  ): Promise<ThsrTrainInfo[]>;
  dailyTrainInfo(
    first?: Date | string,
    second?: Date | string | QueryInput<ThsrTrainInfo>,
    query?: QueryInput<ThsrTrainInfo>,
  ): Promise<ThsrTrainInfo[]> {
    const base = '/v2/Rail/THSR/DailyTrainInfo';
    if (typeof first === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(first)) {
      const date = second as Date | string | undefined;
      const path = `${base}/TrainNo/${segment(first, 'trainNo')}/TrainDate/${trainDate(date)}`;
      return this.list(path, query, 'static');
    }
    const q = second as QueryInput<ThsrTrainInfo> | undefined;
    return this.list(`${base}/TrainDate/${trainDate(first)}`, q ?? query, 'static');
  }

  /**
   * The line geometry as WKT: one item of about 1 MB. Cached with the static TTL.
   * `GET /v2/Rail/THSR/Shape`
   */
  shapes(query?: QueryInput<ThsrShape>): Promise<ThsrShape[]> {
    return this.list('/v2/Rail/THSR/Shape', query, 'static');
  }

  /**
   * The 12 stations in line order with cumulative distance. Cached with the static TTL.
   * `GET /v2/Rail/THSR/StationOfLine`
   */
  stationsOfLine(query?: QueryInput<ThsrStationOfLine>): Promise<ThsrStationOfLine[]> {
    return this.list('/v2/Rail/THSR/StationOfLine', query, 'static');
  }
}
