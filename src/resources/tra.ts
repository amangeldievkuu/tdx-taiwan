import type {
  TraAlert,
  TraAlerts,
  TraGeneralStationTimetable,
  TraGeneralStationTimetables,
  TraGeneralTimetables,
  TraGeneralTrainTimetable,
  TraLine,
  TraLineNetwork,
  TraLineNetworks,
  TraLineTransfer,
  TraLineTransfers,
  TraLines,
  TraNetwork,
  TraNetworks,
  TraNews,
  TraNewsList,
  TraODFare,
  TraODFares,
  TraOperator,
  TraOperators,
  TraShape,
  TraShapes,
  TraSpecificTimetables,
  TraSpecificTrainTimetable,
  TraStation,
  TraStationExit,
  TraStationExits,
  TraStationFacilities,
  TraStationFacility,
  TraStationId,
  TraStationLiveBoard,
  TraStationLiveBoards,
  TraStationOfLine,
  TraStationOfLines,
  TraStationTimetable,
  TraStationTimetables,
  TraStationTransfer,
  TraStationTransfers,
  TraStations,
  TraTimetable,
  TraTrainDates,
  TraTrainLiveBoard,
  TraTrainLiveBoards,
  TraTrainTimetable,
  TraTrainType,
  TraTrainTypes,
} from '../types/tra.js';
import { type ObjectRequester, type QueryInput, segment, trainDate } from './requester.js';

/**
 * Taiwan Railway (臺鐵) endpoints (TDX Rail v3). Every response is a wrapper object; queries
 * apply to the items inside it.
 */
export class TraApi {
  constructor(private readonly object: ObjectRequester) {}

  /**
   * All stations. Cached with the static TTL.
   * `GET /v3/Rail/TRA/Station`
   */
  stations(query?: QueryInput<TraStation>): Promise<TraStations> {
    return this.object('/v3/Rail/TRA/Station', query, 'static');
  }

  /**
   * Trains from one station to another on a day (default: today in Taiwan), with the stop
   * times at those two stations. TDX serves about two months ahead. Cached with the static TTL.
   * `GET /v3/Rail/TRA/DailyTrainTimetable/OD/{OriginStationID}/to/{DestinationStationID}/{TrainDate}`
   *
   * @example tdx.tra.timetable('1000', '4400', '2026-10-22') // 臺北 → 高雄
   */
  timetable(
    from: TraStationId,
    to: TraStationId,
    date?: Date | string,
    query?: QueryInput<TraTrainTimetable>,
  ): Promise<TraTimetable> {
    const path =
      `/v3/Rail/TRA/DailyTrainTimetable/OD/${segment(from, 'from')}/to/${segment(to, 'to')}` +
      `/${trainDate(date)}`;
    return this.object(path, query, 'static');
  }

  /**
   * Fares between two stations, one entry per train type. Cached with the static TTL.
   * `GET /v3/Rail/TRA/ODFare/{OriginStationID}/to/{DestinationStationID}`
   */
  odFare(from: TraStationId, to: TraStationId, query?: QueryInput<TraODFare>): Promise<TraODFares> {
    const path = `/v3/Rail/TRA/ODFare/${segment(from, 'from')}/to/${segment(to, 'to')}`;
    return this.object(path, query, 'static');
  }

  /**
   * Trains about to arrive at or leave a station (or every station), with platform and delay.
   * Only imminent trains are listed. Cached with the real-time TTL.
   * `GET /v3/Rail/TRA/StationLiveBoard[/Station/{StationID}]`
   */
  liveBoard(query?: QueryInput<TraStationLiveBoard>): Promise<TraStationLiveBoards>;
  liveBoard(
    station: TraStationId,
    query?: QueryInput<TraStationLiveBoard>,
  ): Promise<TraStationLiveBoards>;
  liveBoard(
    stationOrQuery?: TraStationId | QueryInput<TraStationLiveBoard>,
    query?: QueryInput<TraStationLiveBoard>,
  ): Promise<TraStationLiveBoards> {
    const base = '/v3/Rail/TRA/StationLiveBoard';
    if (typeof stationOrQuery === 'string') {
      const path = `${base}/Station/${segment(stationOrQuery, 'station')}`;
      return this.object(path, query, 'realtime');
    }
    return this.object(base, stationOrQuery ?? query, 'realtime');
  }

  /**
   * Where a train (or every running train) is now and how late it runs. Cached with the
   * real-time TTL. `GET /v3/Rail/TRA/TrainLiveBoard[/TrainNo/{TrainNo}]`
   */
  trainLiveBoard(query?: QueryInput<TraTrainLiveBoard>): Promise<TraTrainLiveBoards>;
  trainLiveBoard(
    trainNo: string,
    query?: QueryInput<TraTrainLiveBoard>,
  ): Promise<TraTrainLiveBoards>;
  trainLiveBoard(
    trainNoOrQuery?: string | QueryInput<TraTrainLiveBoard>,
    query?: QueryInput<TraTrainLiveBoard>,
  ): Promise<TraTrainLiveBoards> {
    const base = '/v3/Rail/TRA/TrainLiveBoard';
    if (typeof trainNoOrQuery === 'string') {
      const path = `${base}/TrainNo/${segment(trainNoOrQuery, 'trainNo')}`;
      return this.object(path, query, 'realtime');
    }
    return this.object(base, trainNoOrQuery ?? query, 'realtime');
  }

  /**
   * Current service alerts. Cached with the real-time TTL.
   * `GET /v3/Rail/TRA/Alert`
   */
  alerts(query?: QueryInput<TraAlert>): Promise<TraAlerts> {
    return this.object('/v3/Rail/TRA/Alert', query, 'realtime');
  }
  /**
   * The regular timetable: every train's stops and running days, for all trains or one train
   * number. Cached with the static TTL. `GET /v3/Rail/TRA/GeneralTrainTimetable[/TrainNo/{TrainNo}]`
   */
  generalTimetable(query?: QueryInput<TraGeneralTrainTimetable>): Promise<TraGeneralTimetables>;
  generalTimetable(
    trainNo: string,
    query?: QueryInput<TraGeneralTrainTimetable>,
  ): Promise<TraGeneralTimetables>;
  generalTimetable(
    trainNoOrQuery?: string | QueryInput<TraGeneralTrainTimetable>,
    query?: QueryInput<TraGeneralTrainTimetable>,
  ): Promise<TraGeneralTimetables> {
    const base = '/v3/Rail/TRA/GeneralTrainTimetable';
    if (typeof trainNoOrQuery === 'string') {
      return this.object(`${base}/TrainNo/${segment(trainNoOrQuery, 'trainNo')}`, query, 'static');
    }
    return this.object(base, trainNoOrQuery ?? query, 'static');
  }

  /**
   * The regular station timetable: every departure from a station (or all stations) per
   * direction and running days. One station is about 60 KB. Cached with the static TTL.
   * `GET /v3/Rail/TRA/GeneralStationTimetable[/Station/{StationID}]`
   */
  generalStationTimetable(
    query?: QueryInput<TraGeneralStationTimetable>,
  ): Promise<TraGeneralStationTimetables>;
  generalStationTimetable(
    station: TraStationId,
    query?: QueryInput<TraGeneralStationTimetable>,
  ): Promise<TraGeneralStationTimetables>;
  generalStationTimetable(
    stationOrQuery?: TraStationId | QueryInput<TraGeneralStationTimetable>,
    query?: QueryInput<TraGeneralStationTimetable>,
  ): Promise<TraGeneralStationTimetables> {
    const base = '/v3/Rail/TRA/GeneralStationTimetable';
    if (typeof stationOrQuery === 'string') {
      return this.object(`${base}/Station/${segment(stationOrQuery, 'station')}`, query, 'static');
    }
    return this.object(base, stationOrQuery ?? query, 'static');
  }

  /**
   * Every train's full stop list on a day (default: today in Taiwan; about two months ahead).
   * Cached with the static TTL. `GET /v3/Rail/TRA/DailyTrainTimetable/TrainDate/{TrainDate}`
   */
  dailyTimetable(
    date?: Date | string,
    query?: QueryInput<TraTrainTimetable>,
  ): Promise<TraTimetable> {
    return this.object(
      `/v3/Rail/TRA/DailyTrainTimetable/TrainDate/${trainDate(date)}`,
      query,
      'static',
    );
  }

  /**
   * One train's stop list today (TDX v3 has no other-day form). Cached with the static TTL.
   * `GET /v3/Rail/TRA/DailyTrainTimetable/Today/TrainNo/{TrainNo}`
   */
  trainTimetable(trainNo: string, query?: QueryInput<TraTrainTimetable>): Promise<TraTimetable> {
    const path = `/v3/Rail/TRA/DailyTrainTimetable/Today/TrainNo/${segment(trainNo, 'trainNo')}`;
    return this.object(path, query, 'static');
  }

  /**
   * Today's departures from one station, per direction. Cached with the static TTL.
   * `GET /v3/Rail/TRA/DailyStationTimetable/Today/Station/{StationID}`
   */
  stationTimetable(
    station: TraStationId,
    query?: QueryInput<TraStationTimetable>,
  ): Promise<TraStationTimetables> {
    const path = `/v3/Rail/TRA/DailyStationTimetable/Today/Station/${segment(station, 'station')}`;
    return this.object(path, query, 'static');
  }

  /**
   * Departures from every station on a day (default: today in Taiwan). Each item holds a whole
   * station's day, so filter on `StationID`. Cached with the static TTL.
   * `GET /v3/Rail/TRA/DailyStationTimetable/TrainDate/{TrainDate}`
   */
  dailyStationTimetable(
    date?: Date | string,
    query?: QueryInput<TraStationTimetable>,
  ): Promise<TraStationTimetables> {
    const path = `/v3/Rail/TRA/DailyStationTimetable/TrainDate/${trainDate(date)}`;
    return this.object(path, query, 'static');
  }

  /**
   * The dates the daily timetables cover (about two months). Cached with the static TTL.
   * `GET /v3/Rail/TRA/DailyTrainTimetable/TrainDates`
   */
  trainDates(query?: QueryInput<TraTrainDates>): Promise<TraTrainDates> {
    return this.object('/v3/Rail/TRA/DailyTrainTimetable/TrainDates', query, 'static');
  }

  /** Lines (西部幹線, 東部幹線, branches). Cached with the static TTL. `GET /v3/Rail/TRA/Line` */
  lines(query?: QueryInput<TraLine>): Promise<TraLines> {
    return this.object('/v3/Rail/TRA/Line', query, 'static');
  }

  /** Ordered stations of each line. Cached with the static TTL. `GET /v3/Rail/TRA/StationOfLine` */
  stationsOfLine(query?: QueryInput<TraStationOfLine>): Promise<TraStationOfLines> {
    return this.object('/v3/Rail/TRA/StationOfLine', query, 'static');
  }

  /**
   * Train types (55 IDs sharing the codes 1 太魯閣 … 10 區間快). Cached with the static TTL.
   * `GET /v3/Rail/TRA/TrainType`
   */
  trainTypes(query?: QueryInput<TraTrainType>): Promise<TraTrainTypes> {
    return this.object('/v3/Rail/TRA/TrainType', query, 'static');
  }

  /** Station exits with positions. Cached with the static TTL. `GET /v3/Rail/TRA/StationExit` */
  stationExits(query?: QueryInput<TraStationExit>): Promise<TraStationExits> {
    return this.object('/v3/Rail/TRA/StationExit', query, 'static');
  }

  /**
   * Lifts, information desks, drinking fountains and toilets per station. Cached with the static
   * TTL. `GET /v3/Rail/TRA/StationFacility`
   */
  stationFacilities(query?: QueryInput<TraStationFacility>): Promise<TraStationFacilities> {
    return this.object('/v3/Rail/TRA/StationFacility', query, 'static');
  }

  /** TRA news (`Description` may contain HTML). Cached with the real-time TTL. `GET /v3/Rail/TRA/News` */
  news(query?: QueryInput<TraNews>): Promise<TraNewsList> {
    return this.object('/v3/Rail/TRA/News', query, 'realtime');
  }
  /**
   * Trains between two stations on a day (default: today in Taiwan) with **every** stop between
   * them, where `timetable` lists only the two queried stops. Cached with the static TTL.
   * `GET /v3/Rail/TRA/DailyTrainTimetable/OD/Inclusive/{O}/to/{D}/{TrainDate}`
   */
  timetableInclusive(
    from: TraStationId,
    to: TraStationId,
    date?: Date | string,
    query?: QueryInput<TraTrainTimetable>,
  ): Promise<TraTimetable> {
    const od = `${segment(from, 'from')}/to/${segment(to, 'to')}`;
    const path = `/v3/Rail/TRA/DailyTrainTimetable/OD/Inclusive/${od}/${trainDate(date)}`;
    return this.object(path, query, 'static');
  }

  /**
   * Special trains (holiday and event extras) with the dates they run, for all trains or one
   * train number. Cached with the static TTL.
   * `GET /v3/Rail/TRA/SpecificTrainTimetable[/TrainNo/{TrainNo}]`
   */
  specificTimetable(query?: QueryInput<TraSpecificTrainTimetable>): Promise<TraSpecificTimetables>;
  specificTimetable(
    trainNo: string,
    query?: QueryInput<TraSpecificTrainTimetable>,
  ): Promise<TraSpecificTimetables>;
  specificTimetable(
    trainNoOrQuery?: string | QueryInput<TraSpecificTrainTimetable>,
    query?: QueryInput<TraSpecificTrainTimetable>,
  ): Promise<TraSpecificTimetables> {
    const base = '/v3/Rail/TRA/SpecificTrainTimetable';
    if (typeof trainNoOrQuery === 'string') {
      return this.object(`${base}/TrainNo/${segment(trainNoOrQuery, 'trainNo')}`, query, 'static');
    }
    return this.object(base, trainNoOrQuery ?? query, 'static');
  }

  /**
   * Line topology: the segments between adjacent stations with distances. Cached with the
   * static TTL. `GET /v3/Rail/TRA/LineNetwork`
   */
  lineNetwork(query?: QueryInput<TraLineNetwork>): Promise<TraLineNetworks> {
    return this.object('/v3/Rail/TRA/LineNetwork', query, 'static');
  }

  /**
   * Transfers between lines at junction stations with the minutes they take. Cached with the
   * static TTL. `GET /v3/Rail/TRA/LineTransfer`
   */
  lineTransfers(query?: QueryInput<TraLineTransfer>): Promise<TraLineTransfers> {
    return this.object('/v3/Rail/TRA/LineTransfer', query, 'static');
  }

  /**
   * Transfers to buses, bikes, car parks, taxis and ferries at each station, with map links.
   * Cached with the static TTL. `GET /v3/Rail/TRA/StationTransfer`
   */
  stationTransfers(query?: QueryInput<TraStationTransfer>): Promise<TraStationTransfers> {
    return this.object('/v3/Rail/TRA/StationTransfer', query, 'static');
  }

  /**
   * The network record with its map link and lines. Cached with the static TTL.
   * `GET /v3/Rail/TRA/Network`
   */
  network(query?: QueryInput<TraNetwork>): Promise<TraNetworks> {
    return this.object('/v3/Rail/TRA/Network', query, 'static');
  }

  /**
   * The operator with contact, fare and booking URLs. Cached with the static TTL.
   * `GET /v3/Rail/TRA/Operator`
   */
  operators(query?: QueryInput<TraOperator>): Promise<TraOperators> {
    return this.object('/v3/Rail/TRA/Operator', query, 'static');
  }

  /** Line geometries as WKT. Cached with the static TTL. `GET /v3/Rail/TRA/Shape` */
  shapes(query?: QueryInput<TraShape>): Promise<TraShapes> {
    return this.object('/v3/Rail/TRA/Shape', query, 'static');
  }
}
