import type {
  TraAlert,
  TraAlerts,
  TraODFare,
  TraODFares,
  TraStation,
  TraStationId,
  TraStationLiveBoard,
  TraStationLiveBoards,
  TraStations,
  TraTimetable,
  TraTrainLiveBoard,
  TraTrainLiveBoards,
  TraTrainTimetable,
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
   * Trains about to arrive at or leave a station, with platform and delay. Only imminent
   * trains are listed. Cached with the real-time TTL.
   * `GET /v3/Rail/TRA/StationLiveBoard/Station/{StationID}`
   */
  liveBoard(
    station: TraStationId,
    query?: QueryInput<TraStationLiveBoard>,
  ): Promise<TraStationLiveBoards> {
    return this.object(
      `/v3/Rail/TRA/StationLiveBoard/Station/${segment(station, 'station')}`,
      query,
      'realtime',
    );
  }

  /**
   * Where a train is now and how late it runs. Cached with the real-time TTL.
   * `GET /v3/Rail/TRA/TrainLiveBoard/TrainNo/{TrainNo}`
   */
  trainLiveBoard(
    trainNo: string,
    query?: QueryInput<TraTrainLiveBoard>,
  ): Promise<TraTrainLiveBoards> {
    return this.object(
      `/v3/Rail/TRA/TrainLiveBoard/TrainNo/${segment(trainNo, 'trainNo')}`,
      query,
      'realtime',
    );
  }

  /**
   * Current service alerts. Cached with the real-time TTL.
   * `GET /v3/Rail/TRA/Alert`
   */
  alerts(query?: QueryInput<TraAlert>): Promise<TraAlerts> {
    return this.object('/v3/Rail/TRA/Alert', query, 'realtime');
  }
}
