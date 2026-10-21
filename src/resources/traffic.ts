import type {
  TrafficAuthorities,
  TrafficAuthority,
  TrafficCCTV,
  TrafficCCTVs,
  TrafficCity,
  TrafficCongestionLevel,
  TrafficCongestionLevels,
  TrafficETagPair,
  TrafficETagPairLive,
  TrafficETagPairLives,
  TrafficETagPairs,
  TrafficEvent,
  TrafficEvents,
  TrafficLiveEvent,
  TrafficLiveEvents,
  TrafficLiveTraffic,
  TrafficLiveTraffics,
  TrafficNews,
  TrafficNewsList,
  TrafficSection,
  TrafficSections,
  TrafficVD,
  TrafficVDLive,
  TrafficVDLives,
  TrafficVDs,
} from '../types/traffic.js';
import { type ObjectRequester, type QueryInput, segment } from './requester.js';

const TRAFFIC = '/v2/Road/Traffic';
const EVENT = '/v1/Traffic/RoadEvent';

/**
 * Road traffic (路況) endpoints by city, plus the freeways (高速公路局) under `freeway` and the
 * provincial highways (公路局) under `highway`. Every response is a wrapper object whose array is
 * named after the kind (`Sections`, `LiveTraffics`, …); queries apply to the items inside it.
 * Join live traffic to sections on `SectionID`, detectors on `VDID` and eTag pairs on
 * `ETagPairID`. Each kind accepts its own set of cities (see `TrafficCity`); TDX answers an
 * unsupported one with a 400 `TdxApiError` listing the accepted cities.
 */
export class TrafficApi {
  /** National freeways (國道), authority `NFB`. */
  readonly freeway: TrafficRoadApi;
  /** Provincial highways (省道), authority `THB`. */
  readonly highway: TrafficHighwayApi;

  constructor(private readonly object: ObjectRequester) {
    this.freeway = new TrafficRoadApi(object, 'Freeway');
    this.highway = new TrafficHighwayApi(object);
  }

  /**
   * Published road sections of a city (also NewTaipei). Cached with the static TTL.
   * `GET /v2/Road/Traffic/Section/City/{City}`
   */
  sections(city: TrafficCity, query?: QueryInput<TrafficSection>): Promise<TrafficSections> {
    return this.object(`${TRAFFIC}/Section/${cityOf(city)}`, query, 'static');
  }

  /**
   * Live speed, travel time and congestion level per section. Available for YilanCounty,
   * ChanghuaCounty, YunlinCounty, PingtungCounty, Keelung, Taipei, Taichung, Tainan and Taoyuan.
   * Cached with the real-time TTL. `GET /v2/Road/Traffic/Live/City/{City}`
   */
  liveTraffic(
    city: TrafficCity,
    query?: QueryInput<TrafficLiveTraffic>,
  ): Promise<TrafficLiveTraffics> {
    return this.object(`${TRAFFIC}/Live/${cityOf(city)}`, query, 'realtime');
  }

  /**
   * The congestion scales that `liveTraffic` levels refer to. Cached with the static TTL.
   * `GET /v2/Road/Traffic/CongestionLevel/City/{City}`
   */
  congestionLevels(
    city: TrafficCity,
    query?: QueryInput<TrafficCongestionLevel>,
  ): Promise<TrafficCongestionLevels> {
    return this.object(`${TRAFFIC}/CongestionLevel/${cityOf(city)}`, query, 'static');
  }

  /**
   * Traffic cameras with stream or snapshot URLs (also NewTaipei). Cached with the static TTL.
   * `GET /v2/Road/Traffic/CCTV/City/{City}`
   */
  cctvs(city: TrafficCity, query?: QueryInput<TrafficCCTV>): Promise<TrafficCCTVs> {
    return this.object(`${TRAFFIC}/CCTV/${cityOf(city)}`, query, 'static');
  }

  /**
   * Vehicle detectors and the links they watch. Cached with the static TTL.
   * `GET /v2/Road/Traffic/VD/City/{City}`
   */
  vds(city: TrafficCity, query?: QueryInput<TrafficVD>): Promise<TrafficVDs> {
    return this.object(`${TRAFFIC}/VD/${cityOf(city)}`, query, 'static');
  }

  /**
   * Live lane speeds, occupancy and volumes per detector. Cached with the real-time TTL.
   * `GET /v2/Road/Traffic/Live/VD/City/{City}`
   */
  vdLive(city: TrafficCity, query?: QueryInput<TrafficVDLive>): Promise<TrafficVDLives> {
    return this.object(`${TRAFFIC}/Live/VD/${cityOf(city)}`, query, 'realtime');
  }

  /**
   * eTag gantry pairs (measured paths). Not available for Taipei; see `TrafficCity`. Cached with
   * the static TTL. `GET /v2/Road/Traffic/ETagPair/City/{City}`
   */
  etagPairs(city: TrafficCity, query?: QueryInput<TrafficETagPair>): Promise<TrafficETagPairs> {
    return this.object(`${TRAFFIC}/ETagPair/${cityOf(city)}`, query, 'static');
  }

  /**
   * Live travel times between gantry pairs. Same cities as `etagPairs`. Cached with the
   * real-time TTL. `GET /v2/Road/Traffic/Live/ETag/City/{City}`
   */
  etagPairLive(
    city: TrafficCity,
    query?: QueryInput<TrafficETagPairLive>,
  ): Promise<TrafficETagPairLives> {
    return this.object(`${TRAFFIC}/Live/ETag/${cityOf(city)}`, query, 'realtime');
  }

  /**
   * Traffic news (also NewTaipei). Cached with the real-time TTL.
   * `GET /v2/Road/Traffic/Live/News/City/{City}`
   */
  news(city: TrafficCity, query?: QueryInput<TrafficNews>): Promise<TrafficNewsList> {
    return this.object(`${TRAFFIC}/Live/News/${cityOf(city)}`, query, 'realtime');
  }

  /**
   * Announced road events (works, activities, closures) for Taipei, NewTaipei, Taoyuan,
   * Taichung, Tainan, Keelung, MiaoliCounty, ChiayiCounty, PingtungCounty, YilanCounty and
   * KinmenCounty. Cached with the real-time TTL. `GET /v1/Traffic/RoadEvent/Event/City/{City}`
   */
  events(city: TrafficCity, query?: QueryInput<TrafficEvent>): Promise<TrafficEvents> {
    return this.object(`${EVENT}/Event/${cityOf(city)}`, query, 'realtime');
  }

  /**
   * Live road events (accidents, works, congestion) for the `events` cities plus Kaohsiung.
   * Cached with the real-time TTL. `GET /v1/Traffic/RoadEvent/LiveEvent/City/{City}`
   */
  liveEvents(city: TrafficCity, query?: QueryInput<TrafficLiveEvent>): Promise<TrafficLiveEvents> {
    return this.object(`${EVENT}/LiveEvent/${cityOf(city)}`, query, 'realtime');
  }

  /**
   * The road authorities behind `AuthorityCode`. Cached with the static TTL.
   * `GET /v2/Road/Traffic/Basic/Authority`
   */
  authorities(query?: QueryInput<TrafficAuthority>): Promise<TrafficAuthorities> {
    return this.object(`${TRAFFIC}/Basic/Authority`, query, 'static');
  }
}

/**
 * Road traffic for one road network: the freeways (`Freeway`, 高速公路局) or the provincial
 * highways (`Highway`, 公路局). The methods mirror `TrafficApi` without the city argument.
 */
export class TrafficRoadApi {
  constructor(
    protected readonly object: ObjectRequester,
    protected readonly scope: 'Freeway' | 'Highway',
  ) {}

  /**
   * Published road sections.
   * Cached with the static TTL. `GET /v2/Road/Traffic/Section/{Freeway|Highway}`
   */
  sections(query?: QueryInput<TrafficSection>): Promise<TrafficSections> {
    return this.object(`${TRAFFIC}/Section/${this.scope}`, query, 'static');
  }

  /**
   * Live speed, travel time and congestion level per section. Cached with the real-time TTL.
   * `GET /v2/Road/Traffic/Live/{Freeway|Highway}`
   */
  liveTraffic(query?: QueryInput<TrafficLiveTraffic>): Promise<TrafficLiveTraffics> {
    return this.object(`${TRAFFIC}/Live/${this.scope}`, query, 'realtime');
  }

  /**
   * The congestion scales that `liveTraffic` levels refer to. Cached with the static TTL.
   * `GET /v2/Road/Traffic/CongestionLevel/{Freeway|Highway}`
   */
  congestionLevels(query?: QueryInput<TrafficCongestionLevel>): Promise<TrafficCongestionLevels> {
    return this.object(`${TRAFFIC}/CongestionLevel/${this.scope}`, query, 'static');
  }

  /** Traffic cameras. Cached with the static TTL. `GET /v2/Road/Traffic/CCTV/{Freeway|Highway}` */
  cctvs(query?: QueryInput<TrafficCCTV>): Promise<TrafficCCTVs> {
    return this.object(`${TRAFFIC}/CCTV/${this.scope}`, query, 'static');
  }

  /** Vehicle detectors. Cached with the static TTL. `GET /v2/Road/Traffic/VD/{Freeway|Highway}` */
  vds(query?: QueryInput<TrafficVD>): Promise<TrafficVDs> {
    return this.object(`${TRAFFIC}/VD/${this.scope}`, query, 'static');
  }

  /**
   * Live lane speeds, occupancy and volumes per detector. Cached with the real-time TTL.
   * `GET /v2/Road/Traffic/Live/VD/{Freeway|Highway}`
   */
  vdLive(query?: QueryInput<TrafficVDLive>): Promise<TrafficVDLives> {
    return this.object(`${TRAFFIC}/Live/VD/${this.scope}`, query, 'realtime');
  }

  /**
   * eTag gantry pairs.
   * Cached with the static TTL. `GET /v2/Road/Traffic/ETagPair/{Freeway|Highway}`
   */
  etagPairs(query?: QueryInput<TrafficETagPair>): Promise<TrafficETagPairs> {
    return this.object(`${TRAFFIC}/ETagPair/${this.scope}`, query, 'static');
  }

  /**
   * Live travel times between gantry pairs. Cached with the real-time TTL.
   * `GET /v2/Road/Traffic/Live/ETag/{Freeway|Highway}`
   */
  etagPairLive(query?: QueryInput<TrafficETagPairLive>): Promise<TrafficETagPairLives> {
    return this.object(`${TRAFFIC}/Live/ETag/${this.scope}`, query, 'realtime');
  }

  /**
   * Traffic news. The freeway feed omits `Description`. Cached with the real-time TTL.
   * `GET /v2/Road/Traffic/Live/News/{Freeway|Highway}`
   */
  news(query?: QueryInput<TrafficNews>): Promise<TrafficNewsList> {
    return this.object(`${TRAFFIC}/Live/News/${this.scope}`, query, 'realtime');
  }

  /**
   * Live road events (accidents, works, congestion). Cached with the real-time TTL.
   * `GET /v1/Traffic/RoadEvent/LiveEvent/{Freeway|Highway}`
   */
  liveEvents(query?: QueryInput<TrafficLiveEvent>): Promise<TrafficLiveEvents> {
    return this.object(`${EVENT}/LiveEvent/${this.scope}`, query, 'realtime');
  }
}

/** Provincial highways (公路局): everything in `TrafficRoadApi` plus announced events. */
export class TrafficHighwayApi extends TrafficRoadApi {
  constructor(object: ObjectRequester) {
    super(object, 'Highway');
  }

  /**
   * Announced road events on provincial highways. Cached with the real-time TTL.
   * `GET /v1/Traffic/RoadEvent/Event/Highway`
   */
  events(query?: QueryInput<TrafficEvent>): Promise<TrafficEvents> {
    return this.object(`${EVENT}/Event/Highway`, query, 'realtime');
  }
}

function cityOf(city: TrafficCity): string {
  return `City/${segment(city, 'city')}`;
}
