import type {
  TrafficAuthorities,
  TrafficAuthority,
  TrafficCCTV,
  TrafficCCTVs,
  TrafficCMS,
  TrafficCMSLive,
  TrafficCMSLives,
  TrafficCMSs,
  TrafficCity,
  TrafficCongestionLevel,
  TrafficCongestionLevels,
  TrafficETag,
  TrafficETagPair,
  TrafficETagPairLive,
  TrafficETagPairLives,
  TrafficETagPairs,
  TrafficETags,
  TrafficEvent,
  TrafficEvents,
  TrafficLiveEvent,
  TrafficLiveEvents,
  TrafficLiveTraffic,
  TrafficLiveTraffics,
  TrafficNews,
  TrafficNewsList,
  TrafficSection,
  TrafficSectionLink,
  TrafficSectionLinks,
  TrafficSectionShape,
  TrafficSectionShapes,
  TrafficSections,
  TrafficVD,
  TrafficVDLive,
  TrafficVDLives,
  TrafficVDs,
} from '../types/traffic.js';
import { type ObjectRequester, type QueryInput, optional, segment } from './requester.js';

const TRAFFIC = '/v2/Road/Traffic';
const EVENT = '/v1/Traffic/RoadEvent';

/** An item ID placed before the query, or the query itself. */
type IdOrQuery<T> = string | QueryInput<T>;

/**
 * Road traffic (路況) endpoints by city, plus the freeways (高速公路局) under `freeway` and the
 * provincial highways (公路局) under `highway`. Every response is a wrapper object whose array is
 * named after the kind (`Sections`, `LiveTraffics`, …); queries apply to the items inside it.
 * Every list method also accepts one item's ID before the query (`sections(city, sectionId)`),
 * which calls TDX's `…/{ID}` endpoint and returns the same wrapper with that item, or an empty
 * list for an unknown ID. Join live traffic to sections on `SectionID`, detectors on `VDID`,
 * signs on `CMSID` and eTag pairs on `ETagPairID`. Each kind accepts its own set of cities (see
 * `TrafficCity`); TDX answers an unsupported one with a 400 `TdxApiError` listing the accepted
 * cities.
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
   * Published road sections of a city (also NewTaipei), or one section by ID. Cached with the
   * static TTL. `GET /v2/Road/Traffic/Section/City/{City}[/{SectionID}]`
   */
  sections(city: TrafficCity, query?: QueryInput<TrafficSection>): Promise<TrafficSections>;
  sections(
    city: TrafficCity,
    sectionId: string,
    query?: QueryInput<TrafficSection>,
  ): Promise<TrafficSections>;
  sections(
    city: TrafficCity,
    idOrQuery?: IdOrQuery<TrafficSection>,
    query?: QueryInput<TrafficSection>,
  ): Promise<TrafficSections> {
    const base = `${TRAFFIC}/Section/${cityOf(city)}`;
    return this.object(...optional(base, 'sectionId', idOrQuery, query), 'static');
  }

  /**
   * Live speed, travel time and congestion level per section, or for one section by ID.
   * Available for YilanCounty, ChanghuaCounty, YunlinCounty, PingtungCounty, Keelung, Taipei,
   * Taichung, Tainan and Taoyuan. Cached with the real-time TTL.
   * `GET /v2/Road/Traffic/Live/City/{City}[/{SectionID}]`
   */
  liveTraffic(
    city: TrafficCity,
    query?: QueryInput<TrafficLiveTraffic>,
  ): Promise<TrafficLiveTraffics>;
  liveTraffic(
    city: TrafficCity,
    sectionId: string,
    query?: QueryInput<TrafficLiveTraffic>,
  ): Promise<TrafficLiveTraffics>;
  liveTraffic(
    city: TrafficCity,
    idOrQuery?: IdOrQuery<TrafficLiveTraffic>,
    query?: QueryInput<TrafficLiveTraffic>,
  ): Promise<TrafficLiveTraffics> {
    const base = `${TRAFFIC}/Live/${cityOf(city)}`;
    return this.object(...optional(base, 'sectionId', idOrQuery, query), 'realtime');
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
   * Traffic cameras with stream or snapshot URLs (also NewTaipei), or one camera by ID. Cached
   * with the static TTL. `GET /v2/Road/Traffic/CCTV/City/{City}[/{CCTVID}]`
   */
  cctvs(city: TrafficCity, query?: QueryInput<TrafficCCTV>): Promise<TrafficCCTVs>;
  cctvs(city: TrafficCity, cctvId: string, query?: QueryInput<TrafficCCTV>): Promise<TrafficCCTVs>;
  cctvs(
    city: TrafficCity,
    idOrQuery?: IdOrQuery<TrafficCCTV>,
    query?: QueryInput<TrafficCCTV>,
  ): Promise<TrafficCCTVs> {
    const base = `${TRAFFIC}/CCTV/${cityOf(city)}`;
    return this.object(...optional(base, 'cctvId', idOrQuery, query), 'static');
  }

  /**
   * Vehicle detectors and the links they watch, or one detector by ID. Cached with the static
   * TTL. `GET /v2/Road/Traffic/VD/City/{City}[/{VDID}]`
   */
  vds(city: TrafficCity, query?: QueryInput<TrafficVD>): Promise<TrafficVDs>;
  vds(city: TrafficCity, vdId: string, query?: QueryInput<TrafficVD>): Promise<TrafficVDs>;
  vds(
    city: TrafficCity,
    idOrQuery?: IdOrQuery<TrafficVD>,
    query?: QueryInput<TrafficVD>,
  ): Promise<TrafficVDs> {
    const base = `${TRAFFIC}/VD/${cityOf(city)}`;
    return this.object(...optional(base, 'vdId', idOrQuery, query), 'static');
  }

  /**
   * Live lane speeds, occupancy and volumes per detector, or for one detector by ID. Cached
   * with the real-time TTL. `GET /v2/Road/Traffic/Live/VD/City/{City}[/{VDID}]`
   */
  vdLive(city: TrafficCity, query?: QueryInput<TrafficVDLive>): Promise<TrafficVDLives>;
  vdLive(
    city: TrafficCity,
    vdId: string,
    query?: QueryInput<TrafficVDLive>,
  ): Promise<TrafficVDLives>;
  vdLive(
    city: TrafficCity,
    idOrQuery?: IdOrQuery<TrafficVDLive>,
    query?: QueryInput<TrafficVDLive>,
  ): Promise<TrafficVDLives> {
    const base = `${TRAFFIC}/Live/VD/${cityOf(city)}`;
    return this.object(...optional(base, 'vdId', idOrQuery, query), 'realtime');
  }

  /**
   * Changeable message signs (資訊可變標誌) of a city (also NewTaipei), or one sign by ID.
   * Cached with the static TTL. `GET /v2/Road/Traffic/CMS/City/{City}[/{CMSID}]`
   */
  cms(city: TrafficCity, query?: QueryInput<TrafficCMS>): Promise<TrafficCMSs>;
  cms(city: TrafficCity, cmsId: string, query?: QueryInput<TrafficCMS>): Promise<TrafficCMSs>;
  cms(
    city: TrafficCity,
    idOrQuery?: IdOrQuery<TrafficCMS>,
    query?: QueryInput<TrafficCMS>,
  ): Promise<TrafficCMSs> {
    const base = `${TRAFFIC}/CMS/${cityOf(city)}`;
    return this.object(...optional(base, 'cmsId', idOrQuery, query), 'static');
  }

  /**
   * The messages the signs currently show, or one sign's by ID. Cached with the real-time TTL.
   * `GET /v2/Road/Traffic/Live/CMS/City/{City}[/{CMSID}]`
   */
  cmsLive(city: TrafficCity, query?: QueryInput<TrafficCMSLive>): Promise<TrafficCMSLives>;
  cmsLive(
    city: TrafficCity,
    cmsId: string,
    query?: QueryInput<TrafficCMSLive>,
  ): Promise<TrafficCMSLives>;
  cmsLive(
    city: TrafficCity,
    idOrQuery?: IdOrQuery<TrafficCMSLive>,
    query?: QueryInput<TrafficCMSLive>,
  ): Promise<TrafficCMSLives> {
    const base = `${TRAFFIC}/Live/CMS/${cityOf(city)}`;
    return this.object(...optional(base, 'cmsId', idOrQuery, query), 'realtime');
  }

  /**
   * eTag gantries (偵測站), or one by ID. Not available for Taipei; see `TrafficCity`. Cached
   * with the static TTL. `GET /v2/Road/Traffic/ETag/City/{City}[/{ETagGantryID}]`
   */
  etags(city: TrafficCity, query?: QueryInput<TrafficETag>): Promise<TrafficETags>;
  etags(
    city: TrafficCity,
    gantryId: string,
    query?: QueryInput<TrafficETag>,
  ): Promise<TrafficETags>;
  etags(
    city: TrafficCity,
    idOrQuery?: IdOrQuery<TrafficETag>,
    query?: QueryInput<TrafficETag>,
  ): Promise<TrafficETags> {
    const base = `${TRAFFIC}/ETag/${cityOf(city)}`;
    return this.object(...optional(base, 'gantryId', idOrQuery, query), 'static');
  }

  /**
   * eTag gantry pairs (measured paths), or one by ID. Not available for Taipei; see
   * `TrafficCity`. Cached with the static TTL.
   * `GET /v2/Road/Traffic/ETagPair/City/{City}[/{ETagPairID}]`
   */
  etagPairs(city: TrafficCity, query?: QueryInput<TrafficETagPair>): Promise<TrafficETagPairs>;
  etagPairs(
    city: TrafficCity,
    pairId: string,
    query?: QueryInput<TrafficETagPair>,
  ): Promise<TrafficETagPairs>;
  etagPairs(
    city: TrafficCity,
    idOrQuery?: IdOrQuery<TrafficETagPair>,
    query?: QueryInput<TrafficETagPair>,
  ): Promise<TrafficETagPairs> {
    const base = `${TRAFFIC}/ETagPair/${cityOf(city)}`;
    return this.object(...optional(base, 'pairId', idOrQuery, query), 'static');
  }

  /**
   * Live travel times between gantry pairs, or for one pair by ID. Same cities as `etagPairs`.
   * Cached with the real-time TTL. `GET /v2/Road/Traffic/Live/ETag/City/{City}[/{ETagPairID}]`
   */
  etagPairLive(
    city: TrafficCity,
    query?: QueryInput<TrafficETagPairLive>,
  ): Promise<TrafficETagPairLives>;
  etagPairLive(
    city: TrafficCity,
    pairId: string,
    query?: QueryInput<TrafficETagPairLive>,
  ): Promise<TrafficETagPairLives>;
  etagPairLive(
    city: TrafficCity,
    idOrQuery?: IdOrQuery<TrafficETagPairLive>,
    query?: QueryInput<TrafficETagPairLive>,
  ): Promise<TrafficETagPairLives> {
    const base = `${TRAFFIC}/Live/ETag/${cityOf(city)}`;
    return this.object(...optional(base, 'pairId', idOrQuery, query), 'realtime');
  }

  /**
   * The basic links (基礎路段) each published section is made of, or one section's by ID.
   * Cached with the static TTL. `GET /v2/Road/Traffic/SectionLink/City/{City}[/{SectionID}]`
   */
  sectionLinks(
    city: TrafficCity,
    query?: QueryInput<TrafficSectionLink>,
  ): Promise<TrafficSectionLinks>;
  sectionLinks(
    city: TrafficCity,
    sectionId: string,
    query?: QueryInput<TrafficSectionLink>,
  ): Promise<TrafficSectionLinks>;
  sectionLinks(
    city: TrafficCity,
    idOrQuery?: IdOrQuery<TrafficSectionLink>,
    query?: QueryInput<TrafficSectionLink>,
  ): Promise<TrafficSectionLinks> {
    const base = `${TRAFFIC}/SectionLink/${cityOf(city)}`;
    return this.object(...optional(base, 'sectionId', idOrQuery, query), 'static');
  }

  /**
   * Section geometries as WKT line strings, or one section's by ID. Cached with the static TTL.
   * `GET /v2/Road/Traffic/SectionShape/City/{City}[/{SectionID}]`
   */
  sectionShapes(
    city: TrafficCity,
    query?: QueryInput<TrafficSectionShape>,
  ): Promise<TrafficSectionShapes>;
  sectionShapes(
    city: TrafficCity,
    sectionId: string,
    query?: QueryInput<TrafficSectionShape>,
  ): Promise<TrafficSectionShapes>;
  sectionShapes(
    city: TrafficCity,
    idOrQuery?: IdOrQuery<TrafficSectionShape>,
    query?: QueryInput<TrafficSectionShape>,
  ): Promise<TrafficSectionShapes> {
    const base = `${TRAFFIC}/SectionShape/${cityOf(city)}`;
    return this.object(...optional(base, 'sectionId', idOrQuery, query), 'static');
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
 * highways (`Highway`, 公路局). The methods mirror `TrafficApi` without the city argument, and
 * likewise accept one item's ID before the query.
 */
export class TrafficRoadApi {
  constructor(
    protected readonly object: ObjectRequester,
    protected readonly scope: 'Freeway' | 'Highway',
  ) {}

  /**
   * Published road sections, or one by ID. Cached with the static TTL.
   * `GET /v2/Road/Traffic/Section/{Freeway|Highway}[/{SectionID}]`
   */
  sections(query?: QueryInput<TrafficSection>): Promise<TrafficSections>;
  sections(sectionId: string, query?: QueryInput<TrafficSection>): Promise<TrafficSections>;
  sections(
    idOrQuery?: IdOrQuery<TrafficSection>,
    query?: QueryInput<TrafficSection>,
  ): Promise<TrafficSections> {
    const base = `${TRAFFIC}/Section/${this.scope}`;
    return this.object(...optional(base, 'sectionId', idOrQuery, query), 'static');
  }

  /**
   * Live speed, travel time and congestion level per section, or for one section by ID.
   * Cached with the real-time TTL. `GET /v2/Road/Traffic/Live/{Freeway|Highway}[/{SectionID}]`
   */
  liveTraffic(query?: QueryInput<TrafficLiveTraffic>): Promise<TrafficLiveTraffics>;
  liveTraffic(
    sectionId: string,
    query?: QueryInput<TrafficLiveTraffic>,
  ): Promise<TrafficLiveTraffics>;
  liveTraffic(
    idOrQuery?: IdOrQuery<TrafficLiveTraffic>,
    query?: QueryInput<TrafficLiveTraffic>,
  ): Promise<TrafficLiveTraffics> {
    const base = `${TRAFFIC}/Live/${this.scope}`;
    return this.object(...optional(base, 'sectionId', idOrQuery, query), 'realtime');
  }

  /**
   * The congestion scales that `liveTraffic` levels refer to. Cached with the static TTL.
   * `GET /v2/Road/Traffic/CongestionLevel/{Freeway|Highway}`
   */
  congestionLevels(query?: QueryInput<TrafficCongestionLevel>): Promise<TrafficCongestionLevels> {
    return this.object(`${TRAFFIC}/CongestionLevel/${this.scope}`, query, 'static');
  }

  /**
   * Traffic cameras, or one by ID. Cached with the static TTL.
   * `GET /v2/Road/Traffic/CCTV/{Freeway|Highway}[/{CCTVID}]`
   */
  cctvs(query?: QueryInput<TrafficCCTV>): Promise<TrafficCCTVs>;
  cctvs(cctvId: string, query?: QueryInput<TrafficCCTV>): Promise<TrafficCCTVs>;
  cctvs(
    idOrQuery?: IdOrQuery<TrafficCCTV>,
    query?: QueryInput<TrafficCCTV>,
  ): Promise<TrafficCCTVs> {
    const base = `${TRAFFIC}/CCTV/${this.scope}`;
    return this.object(...optional(base, 'cctvId', idOrQuery, query), 'static');
  }

  /**
   * Vehicle detectors, or one by ID. Cached with the static TTL.
   * `GET /v2/Road/Traffic/VD/{Freeway|Highway}[/{VDID}]`
   */
  vds(query?: QueryInput<TrafficVD>): Promise<TrafficVDs>;
  vds(vdId: string, query?: QueryInput<TrafficVD>): Promise<TrafficVDs>;
  vds(idOrQuery?: IdOrQuery<TrafficVD>, query?: QueryInput<TrafficVD>): Promise<TrafficVDs> {
    const base = `${TRAFFIC}/VD/${this.scope}`;
    return this.object(...optional(base, 'vdId', idOrQuery, query), 'static');
  }

  /**
   * Live lane speeds, occupancy and volumes per detector, or for one detector by ID. Cached
   * with the real-time TTL. `GET /v2/Road/Traffic/Live/VD/{Freeway|Highway}[/{VDID}]`
   */
  vdLive(query?: QueryInput<TrafficVDLive>): Promise<TrafficVDLives>;
  vdLive(vdId: string, query?: QueryInput<TrafficVDLive>): Promise<TrafficVDLives>;
  vdLive(
    idOrQuery?: IdOrQuery<TrafficVDLive>,
    query?: QueryInput<TrafficVDLive>,
  ): Promise<TrafficVDLives> {
    const base = `${TRAFFIC}/Live/VD/${this.scope}`;
    return this.object(...optional(base, 'vdId', idOrQuery, query), 'realtime');
  }

  /**
   * Changeable message signs, or one by ID. Cached with the static TTL.
   * `GET /v2/Road/Traffic/CMS/{Freeway|Highway}[/{CMSID}]`
   */
  cms(query?: QueryInput<TrafficCMS>): Promise<TrafficCMSs>;
  cms(cmsId: string, query?: QueryInput<TrafficCMS>): Promise<TrafficCMSs>;
  cms(idOrQuery?: IdOrQuery<TrafficCMS>, query?: QueryInput<TrafficCMS>): Promise<TrafficCMSs> {
    const base = `${TRAFFIC}/CMS/${this.scope}`;
    return this.object(...optional(base, 'cmsId', idOrQuery, query), 'static');
  }

  /**
   * The messages the signs currently show, or one sign's by ID. Cached with the real-time TTL.
   * `GET /v2/Road/Traffic/Live/CMS/{Freeway|Highway}[/{CMSID}]`
   */
  cmsLive(query?: QueryInput<TrafficCMSLive>): Promise<TrafficCMSLives>;
  cmsLive(cmsId: string, query?: QueryInput<TrafficCMSLive>): Promise<TrafficCMSLives>;
  cmsLive(
    idOrQuery?: IdOrQuery<TrafficCMSLive>,
    query?: QueryInput<TrafficCMSLive>,
  ): Promise<TrafficCMSLives> {
    const base = `${TRAFFIC}/Live/CMS/${this.scope}`;
    return this.object(...optional(base, 'cmsId', idOrQuery, query), 'realtime');
  }

  /**
   * eTag gantries, or one by ID. Cached with the static TTL.
   * `GET /v2/Road/Traffic/ETag/{Freeway|Highway}[/{ETagGantryID}]`
   */
  etags(query?: QueryInput<TrafficETag>): Promise<TrafficETags>;
  etags(gantryId: string, query?: QueryInput<TrafficETag>): Promise<TrafficETags>;
  etags(
    idOrQuery?: IdOrQuery<TrafficETag>,
    query?: QueryInput<TrafficETag>,
  ): Promise<TrafficETags> {
    const base = `${TRAFFIC}/ETag/${this.scope}`;
    return this.object(...optional(base, 'gantryId', idOrQuery, query), 'static');
  }

  /**
   * eTag gantry pairs, or one by ID. Cached with the static TTL.
   * `GET /v2/Road/Traffic/ETagPair/{Freeway|Highway}[/{ETagPairID}]`
   */
  etagPairs(query?: QueryInput<TrafficETagPair>): Promise<TrafficETagPairs>;
  etagPairs(pairId: string, query?: QueryInput<TrafficETagPair>): Promise<TrafficETagPairs>;
  etagPairs(
    idOrQuery?: IdOrQuery<TrafficETagPair>,
    query?: QueryInput<TrafficETagPair>,
  ): Promise<TrafficETagPairs> {
    const base = `${TRAFFIC}/ETagPair/${this.scope}`;
    return this.object(...optional(base, 'pairId', idOrQuery, query), 'static');
  }

  /**
   * Live travel times between gantry pairs, or for one pair by ID. Cached with the real-time
   * TTL. `GET /v2/Road/Traffic/Live/ETag/{Freeway|Highway}[/{ETagPairID}]`
   */
  etagPairLive(query?: QueryInput<TrafficETagPairLive>): Promise<TrafficETagPairLives>;
  etagPairLive(
    pairId: string,
    query?: QueryInput<TrafficETagPairLive>,
  ): Promise<TrafficETagPairLives>;
  etagPairLive(
    idOrQuery?: IdOrQuery<TrafficETagPairLive>,
    query?: QueryInput<TrafficETagPairLive>,
  ): Promise<TrafficETagPairLives> {
    const base = `${TRAFFIC}/Live/ETag/${this.scope}`;
    return this.object(...optional(base, 'pairId', idOrQuery, query), 'realtime');
  }

  /**
   * The basic links each published section is made of, or one section's by ID. Cached with
   * the static TTL. `GET /v2/Road/Traffic/SectionLink/{Freeway|Highway}[/{SectionID}]`
   */
  sectionLinks(query?: QueryInput<TrafficSectionLink>): Promise<TrafficSectionLinks>;
  sectionLinks(
    sectionId: string,
    query?: QueryInput<TrafficSectionLink>,
  ): Promise<TrafficSectionLinks>;
  sectionLinks(
    idOrQuery?: IdOrQuery<TrafficSectionLink>,
    query?: QueryInput<TrafficSectionLink>,
  ): Promise<TrafficSectionLinks> {
    const base = `${TRAFFIC}/SectionLink/${this.scope}`;
    return this.object(...optional(base, 'sectionId', idOrQuery, query), 'static');
  }

  /**
   * Section geometries as WKT line strings, or one section's by ID. Cached with the static TTL.
   * `GET /v2/Road/Traffic/SectionShape/{Freeway|Highway}[/{SectionID}]`
   */
  sectionShapes(query?: QueryInput<TrafficSectionShape>): Promise<TrafficSectionShapes>;
  sectionShapes(
    sectionId: string,
    query?: QueryInput<TrafficSectionShape>,
  ): Promise<TrafficSectionShapes>;
  sectionShapes(
    idOrQuery?: IdOrQuery<TrafficSectionShape>,
    query?: QueryInput<TrafficSectionShape>,
  ): Promise<TrafficSectionShapes> {
    const base = `${TRAFFIC}/SectionShape/${this.scope}`;
    return this.object(...optional(base, 'sectionId', idOrQuery, query), 'static');
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
