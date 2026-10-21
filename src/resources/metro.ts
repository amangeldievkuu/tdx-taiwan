import type {
  MetroAlert,
  MetroAlertSystem,
  MetroAlerts,
  MetroFirstLastTimetable,
  MetroFrequency,
  MetroLine,
  MetroLineTransfer,
  MetroLiveBoard,
  MetroLiveBoardSystem,
  MetroLivePosition,
  MetroLivePositionSystem,
  MetroLivePositions,
  MetroNews,
  MetroNewsList,
  MetroNewsSystem,
  MetroODFare,
  MetroRoute,
  MetroStation,
  MetroStationExit,
  MetroStationFacility,
  MetroStationOfLine,
  MetroStationOfRoute,
  MetroStationTimetable,
  MetroStationTransfer,
  MetroStationTransfers,
  MetroSystem,
  MetroTimetableSystem,
} from '../types/metro.js';
import { type ListRequester, type ObjectRequester, type QueryInput, segment } from './requester.js';

/** Metro, light rail and gondola (捷運/輕軌/纜車) endpoints. */
export class MetroApi {
  constructor(
    private readonly list: ListRequester,
    private readonly object: ObjectRequester,
  ) {}

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

  /**
   * Current service alerts of a rail system. Returns an object; the query applies to its
   * `Alerts` items. Cached with the real-time TTL. Not available for NTDLRT, NTMC or NTALRT.
   * `GET /v2/Rail/Metro/Alert/{RailSystem}`
   */
  alerts(system: MetroAlertSystem, query?: QueryInput<MetroAlert>): Promise<MetroAlerts> {
    return this.object(`/v2/Rail/Metro/Alert/${segment(system, 'system')}`, query, 'realtime');
  }
  /**
   * Station exits with position, address and stairs / escalator / lift flags. Cached with the
   * static TTL. `GET /v2/Rail/Metro/StationExit/{RailSystem}`
   */
  stationExits(
    system: MetroSystem,
    query?: QueryInput<MetroStationExit>,
  ): Promise<MetroStationExit[]> {
    return this.list(`/v2/Rail/Metro/StationExit/${segment(system, 'system')}`, query, 'static');
  }

  /**
   * Lifts, information desks, drinking fountains and toilets per station, with map links.
   * Cached with the static TTL. `GET /v2/Rail/Metro/StationFacility/{RailSystem}`
   */
  stationFacilities(
    system: MetroSystem,
    query?: QueryInput<MetroStationFacility>,
  ): Promise<MetroStationFacility[]> {
    return this.list(
      `/v2/Rail/Metro/StationFacility/${segment(system, 'system')}`,
      query,
      'static',
    );
  }

  /**
   * Transfers between lines at interchange stations, with the minutes they take (TRTC, KRTC,
   * NTMC). Cached with the static TTL. `GET /v2/Rail/Metro/LineTransfer/{RailSystem}`
   */
  lineTransfers(
    system: MetroSystem,
    query?: QueryInput<MetroLineTransfer>,
  ): Promise<MetroLineTransfer[]> {
    return this.list(`/v2/Rail/Metro/LineTransfer/${segment(system, 'system')}`, query, 'static');
  }

  /**
   * Transfers to buses, bikes, car parks and other modes at each exit (TRTC, NTMC, TYMC).
   * Returns an object; the query applies to its `StationTransfers`. Cached with the static TTL.
   * `GET /v2/Rail/Metro/StationTransfer/{RailSystem}`
   */
  stationTransfers(
    system: MetroSystem,
    query?: QueryInput<MetroStationTransfer>,
  ): Promise<MetroStationTransfers> {
    return this.object(
      `/v2/Rail/Metro/StationTransfer/${segment(system, 'system')}`,
      query,
      'static',
    );
  }

  /**
   * Service routes (a line's end-to-end runs, one per direction) with run time and length.
   * Cached with the static TTL. `GET /v2/Rail/Metro/Route/{RailSystem}`
   */
  routes(system: MetroSystem, query?: QueryInput<MetroRoute>): Promise<MetroRoute[]> {
    return this.list(`/v2/Rail/Metro/Route/${segment(system, 'system')}`, query, 'static');
  }

  /**
   * Ordered stations of each service route. Cached with the static TTL.
   * `GET /v2/Rail/Metro/StationOfRoute/{RailSystem}`
   */
  stationsOfRoute(
    system: MetroSystem,
    query?: QueryInput<MetroStationOfRoute>,
  ): Promise<MetroStationOfRoute[]> {
    return this.list(`/v2/Rail/Metro/StationOfRoute/${segment(system, 'system')}`, query, 'static');
  }

  /**
   * Headways per route, kind of day and time band (TRTC, TYMC, TMRT, NTMC, KRTC). Cached with
   * the static TTL. `GET /v2/Rail/Metro/Frequency/{RailSystem}`
   */
  frequency(system: MetroSystem, query?: QueryInput<MetroFrequency>): Promise<MetroFrequency[]> {
    return this.list(`/v2/Rail/Metro/Frequency/${segment(system, 'system')}`, query, 'static');
  }

  /**
   * Every departure from each station towards each destination, per kind of day. TRTC does not
   * publish the 文湖線 here (use `frequency`). Cached with the static TTL.
   * `GET /v2/Rail/Metro/StationTimeTable/{RailSystem}`
   */
  stationTimetable(
    system: MetroTimetableSystem,
    query?: QueryInput<MetroStationTimetable>,
  ): Promise<MetroStationTimetable[]> {
    return this.list(
      `/v2/Rail/Metro/StationTimeTable/${segment(system, 'system')}`,
      query,
      'static',
    );
  }

  /**
   * News of an operator (TRTC, KRTC, TYMC, KLRT, TMRT). Returns an object; the query applies to
   * its `Newses`. Cached with the real-time TTL. `GET /v2/Rail/Metro/News/{RailSystem}`
   */
  news(system: MetroNewsSystem, query?: QueryInput<MetroNews>): Promise<MetroNewsList> {
    return this.object(`/v2/Rail/Metro/News/${segment(system, 'system')}`, query, 'realtime');
  }

  /**
   * Live train positions. Only the Kaohsiung light rail (`KLRT`) publishes them; other systems
   * get a 400. Returns an object; the query applies to its `LivePositions`. Cached with the
   * real-time TTL. `GET /v2/Rail/Metro/LivePosition/{RailSystem}`
   */
  livePosition(
    system: MetroLivePositionSystem,
    query?: QueryInput<MetroLivePosition>,
  ): Promise<MetroLivePositions> {
    return this.object(
      `/v2/Rail/Metro/LivePosition/${segment(system, 'system')}`,
      query,
      'realtime',
    );
  }
}
