import type {
  MetroFirstLastTimetable,
  MetroLine,
  MetroLiveBoard,
  MetroLiveBoardSystem,
  MetroODFare,
  MetroStation,
  MetroStationOfLine,
  MetroSystem,
  MetroTimetableSystem,
} from '../types/metro.js';
import { type ListRequester, type QueryInput, segment } from './requester.js';

/** Metro, light rail and gondola (捷運/輕軌/纜車) endpoints. */
export class MetroApi {
  constructor(private readonly list: ListRequester) {}

  /**
   * Stations of a rail system. Cached with the static TTL.
   * `GET /v2/Rail/Metro/Station/{RailSystem}`
   */
  stations(system: MetroSystem, query?: QueryInput<MetroStation>): Promise<MetroStation[]> {
    return this.list(`/v2/Rail/Metro/Station/${segment(system, 'system')}`, query, 'static');
  }

  /**
   * Lines of a rail system. Cached with the static TTL.
   * `GET /v2/Rail/Metro/Line/{RailSystem}`
   */
  lines(system: MetroSystem, query?: QueryInput<MetroLine>): Promise<MetroLine[]> {
    return this.list(`/v2/Rail/Metro/Line/${segment(system, 'system')}`, query, 'static');
  }

  /**
   * Ordered stations of each line. Cached with the static TTL.
   * `GET /v2/Rail/Metro/StationOfLine/{RailSystem}`
   */
  stationsOfLine(
    system: MetroSystem,
    query?: QueryInput<MetroStationOfLine>,
  ): Promise<MetroStationOfLine[]> {
    return this.list(`/v2/Rail/Metro/StationOfLine/${segment(system, 'system')}`, query, 'static');
  }

  /**
   * Next-train board for each station and direction; `EstimateTime` is in minutes.
   * Cached with the real-time TTL. Only TRTC, KRTC, TYMC and KLRT are supported, and TRTC
   * only lists trains arriving right now (`EstimateTime` 0), not every station.
   * `GET /v2/Rail/Metro/LiveBoard/{RailSystem}`
   */
  liveBoard(
    system: MetroLiveBoardSystem,
    query?: QueryInput<MetroLiveBoard>,
  ): Promise<MetroLiveBoard[]> {
    return this.list(`/v2/Rail/Metro/LiveBoard/${segment(system, 'system')}`, query, 'realtime');
  }

  /**
   * First and last train per station and direction. Cached with the static TTL.
   * `GET /v2/Rail/Metro/FirstLastTimetable/{RailSystem}`
   */
  firstLastTimetable(
    system: MetroTimetableSystem,
    query?: QueryInput<MetroFirstLastTimetable>,
  ): Promise<MetroFirstLastTimetable[]> {
    return this.list(
      `/v2/Rail/Metro/FirstLastTimetable/${segment(system, 'system')}`,
      query,
      'static',
    );
  }

  /**
   * Fares between every pair of stations. Cached with the static TTL. The full list is large
   * (about 15,000 pairs for TRTC), so filter on `OriginStationID` / `DestinationStationID`.
   * `GET /v2/Rail/Metro/ODFare/{RailSystem}`
   */
  odFare(system: MetroSystem, query?: QueryInput<MetroODFare>): Promise<MetroODFare[]> {
    return this.list(`/v2/Rail/Metro/ODFare/${segment(system, 'system')}`, query, 'static');
  }
}
