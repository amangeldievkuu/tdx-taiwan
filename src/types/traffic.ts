// Road traffic types, transcribed from the TDX 路況資訊 v2 OpenAPI spec
// (PTX.Service.DTO.Traffic.Specification.V2.API.*) and the 道路事件 v1 spec
// (PTX.Model.DataMarket.POCO.Event.*). Every endpoint wraps its items in an object; live data
// names the array per kind (`Sections`, `LiveTraffics`, …) where the spec says `Items`, and never
// sends `Count`. Where live data contradicts the spec, the type follows the data and says so;
// the observations come from checking Taipei, the freeways and the provincial highways on
// 2026-10-21. Optional (`?`) means the field is not in the schema's `required` list; the spec
// marks nothing nullable.
import type { DateTimeString, Flag, OpenString } from './common.js';

/**
 * `City` path values. Each kind accepts its own subset and TDX answers 400 with the accepted
 * list for the others (checked 2026-10-21):
 * - sections, CCTVs, news: the 14 below from HsinchuCounty to KinmenCounty plus NewTaipei
 * - live traffic: YilanCounty, ChanghuaCounty, YunlinCounty, PingtungCounty, Keelung, Taipei,
 *   Taichung, Tainan, Taoyuan
 * - VDs: HsinchuCounty, NantouCounty, YunlinCounty, ChiayiCounty, PingtungCounty, TaitungCounty,
 *   HualienCounty, Keelung, Taipei, Kaohsiung, Taichung, Tainan, Taoyuan, KinmenCounty
 * - eTag pairs: YilanCounty, HsinchuCounty, ChanghuaCounty, YunlinCounty, ChiayiCounty,
 *   PingtungCounty, TaitungCounty, Keelung, Hsinchu, Chiayi, NewTaipei, Taichung, Taoyuan
 * - events: Taipei, NewTaipei, Taoyuan, Taichung, Tainan, Keelung, MiaoliCounty, ChiayiCounty,
 *   PingtungCounty, YilanCounty, KinmenCounty; live events also Kaohsiung
 */
export type TrafficCity = OpenString<
  | 'Taipei'
  | 'NewTaipei'
  | 'Taoyuan'
  | 'Taichung'
  | 'Tainan'
  | 'Kaohsiung'
  | 'Keelung'
  | 'Hsinchu'
  | 'HsinchuCounty'
  | 'MiaoliCounty'
  | 'ChanghuaCounty'
  | 'NantouCounty'
  | 'YunlinCounty'
  | 'Chiayi'
  | 'ChiayiCounty'
  | 'PingtungCounty'
  | 'YilanCounty'
  | 'HualienCounty'
  | 'TaitungCounty'
  | 'KinmenCounty'
>;

/**
 * 道路分類: 0 = 國道 (freeway), 1 = 快速道路 (expressway), 2 = 市區快速道路 (urban expressway),
 * 3 = 省道 (provincial highway), 4 = 縣道 (county road), 5 = 鄉道 (township road),
 * 6 = 市區一般道路 (urban street), 7 = 匝道 (ramp).
 */
export type TrafficRoadClass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** 設備狀態: 0 = 正常 (normal), 1 = 通訊異常 (comms fault), 2 = 停用或施工中 (disabled or works), 3 = 設備故障 (broken). */
export type TrafficDeviceStatus = 0 | 1 | 2 | 3;

/**
 * 設置地點位置類型: 1 = 路側 (roadside), 2 = 道路中央分隔島 (median), 3 = 快慢分隔島 (lane divider),
 * 4 = 車道上門架 (gantry), 5 = 車道鋪面 (in the pavement), 6 = 其他 (other).
 */
export type TrafficLocationType = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * 車道種類: 1 = 一般車道 (general), 2 = 快車道 (fast), 3 = 慢車道 (slow), 4 = 機車道 (motorcycle),
 * 5 = 高承載車道 (HOV), 6 = 公車專用道 (bus), 7 = 轉向車道 (turning), 8 = 路肩 (shoulder),
 * 9 = 輔助車道 (auxiliary), 10 = 調撥車道 (reversible), 11 = 其他 (other).
 */
export type TrafficLaneType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

/** VD 類別: 1 = 線圈式 (loop), 2 = 微波式 (microwave), 3 = 影像式 (video), 4 = 紅外線 (infrared), 5 = 超音波 (ultrasonic), 6 = 其它. */
export type TrafficVDType = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * 車流偵側類型: 1 = 高快速公路/市快主線 (freeway or expressway mainline), 2 = 高快速公路/市快匝道
 * (ramp), 3 = 其它道路路段中 (mid-block), 4 = 其它道路路口 (near an intersection or stop line).
 */
export type TrafficDetectionType = 1 | 2 | 3 | 4;

/** 0 = 不包含 / 偵測單向 (no), 1 = 包含 / 偵測雙向 (yes). */
export type TrafficFlag = Flag;

/** 壅塞衡量基準: `Combined` 綜合指標, `Occupancy` 佔有率, `Speed` 速率, `TravelTime` 旅行時間. */
export type TrafficMeasureIndex = OpenString<'Combined' | 'Occupancy' | 'Speed' | 'TravelTime'>;

/** 消息類別: 1 = 交管措施 (traffic control), 2 = 事故 (accident), 3 = 壅塞 (congestion), 4 = 施工 (works), 99 = 其他. */
export type TrafficNewsCategory = 1 | 2 | 3 | 4 | 99;

/**
 * 事件類別: 1 = 交通事故 (accident), 2 = 施工 (works), 3 = 壅塞 (congestion), 4 = 特殊管制
 * (special control), 5 = 天氣 (weather), 6 = 災害 (disaster), 7 = 活動 (event), 8 = 其它異常告警.
 */
export type TrafficEventType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** 事件空間發生位置: 0 = 道路主線, 1 = 交流道或匝道, 2 = 匝道出入口, 3 = 交叉路口, 254 = 其他, 255 = 未知. */
export type TrafficEventLocationType = 0 | 1 | 2 | 3 | 254 | 255;

/** 對交通影響的嚴重程度: -99 = 來源未提供, 0 = 無影響, 1 = 部分阻斷交通, 2 = 完全阻斷交通, 254 = 其他, 255 = 未知. */
export type TrafficSeverity = -99 | 0 | 1 | 2 | 254 | 255;

/** 受阻斷方向: -99 = 來源未提供, 0 = 無阻斷, 1 = 僅單向, 2 = 雙向, 254 = 其他, 255 = 未知. */
export type TrafficBlockWay = -99 | 0 | 1 | 2 | 254 | 255;

/** Compass bearing of a link or camera view: `N`, `NE`, `E`, `SE`, `S`, `SW`, `W`, `NW`. */
export type TrafficBearing = OpenString<'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'>;

/**
 * Fields every 路況資訊 wrapper carries. The spec's `Count` is never sent; `LinkVersion` comes
 * only from the freeway (NFB) and highway (THB) authorities.
 */
export interface TrafficWrapperHeader {
  /** When TDX processed the data. */
  UpdateTime: DateTimeString;
  /** TDX refresh period in seconds. */
  UpdateInterval: number;
  /** When the source authority published the data. */
  SrcUpdateTime: DateTimeString;
  /** Source refresh period in seconds; `-1` = irregular. */
  SrcUpdateInterval: number;
  /** Authority code, e.g. `TPE`, `NWT`, `NFB` (freeways), `THB` (provincial highways). */
  AuthorityCode: string;
  /** Link-network version, e.g. `25.12.1`. Only NFB and THB send it. */
  LinkVersion?: string;
  /** Total item count. In the spec but never sent. */
  Count?: number;
}

/** Start and end description of a road section (RoadSection). */
export interface TrafficRoadSection {
  Start?: string;
  End?: string;
}

/** WGS84 point (Point). */
export interface TrafficPosition {
  PositionLat?: number;
  PositionLon?: number;
}

/** Start and end mileage, e.g. `36K+525` (SectionMile). */
export interface TrafficSectionMile {
  StartKM?: string;
  EndKM?: string;
}

/** Reference to a 基礎路段 link code (LinkIDItem). */
export interface TrafficLinkRef {
  LinkID: string;
}

/** OpenLR location reference (OpenLRItem). */
export interface TrafficOpenLR {
  OpenLR: string;
}

/** Published road section (Section). */
export interface TrafficSection {
  /** Section code, e.g. `L_2000100000020A` (Taipei) or `0000100000010A` (freeway). */
  SectionID: string;
  LinkIDs?: TrafficLinkRef[];
  OpenLRs?: TrafficOpenLR[];
  SubAuthorityCode?: string;
  /** Chinese description, e.g. `國道1號(基隆端到基隆)`. */
  SectionName: string;
  RoadID: string;
  RoadName: string;
  RoadClass: TrafficRoadClass;
  /** Direction code, e.g. `N`, `S`, `E`, `W`, `SE`. */
  RoadDirection: string;
  RoadSection: TrafficRoadSection;
  /** Length in km. */
  SectionLength?: number;
  SectionMile?: TrafficSectionMile;
  SectionStart?: TrafficPosition;
  SectionEnd?: TrafficPosition;
  /** Speed limit in km/h. */
  SpeedLimit?: number;
}

/** Sections — `GET /v2/Road/Traffic/Section/{City/{City}|Freeway|Highway}`. */
export interface TrafficSections extends TrafficWrapperHeader {
  Sections: TrafficSection[];
}

/** Which inputs fed a live traffic reading (DataSources). */
export interface TrafficDataSources {
  HasHistorical: TrafficFlag;
  /** Vehicle detectors. */
  HasVD: TrafficFlag;
  /** Automatic vehicle identification. */
  HasAVI: TrafficFlag;
  HasETAG: TrafficFlag;
  /** GPS vehicle probes. */
  HasGVP: TrafficFlag;
  /** Cellular vehicle probes. */
  HasCVP: TrafficFlag;
  HasOthers: TrafficFlag;
}

/** Live speed and congestion of a section (LiveTraffic). */
export interface TrafficLiveTraffic {
  SectionID?: string;
  LinkIDs?: TrafficLinkRef[];
  OpenLRs?: TrafficOpenLR[];
  SubAuthorityCode?: string;
  /** Average travel time in seconds; `-1` when the road is closed. */
  TravelTime: number;
  /** Average speed in km/h; `-1` when the road is closed. */
  TravelSpeed: number;
  /** Which `TrafficCongestionLevel` set the level belongs to, e.g. `A` or `RoadClass2_default`. */
  CongestionLevelID: string;
  /**
   * Congestion level as a string: `"1"` free-flowing up to `"5"` (Taipei also uses `"6"`),
   * `"0"` unknown, `"-1"` closed, `"-99"` bad data. Look the name up in `congestionLevels`.
   */
  CongestionLevel: string;
  DataSources: TrafficDataSources;
  DataCollectTime: DateTimeString;
}

/** Live traffic — `GET /v2/Road/Traffic/Live/{City/{City}|Freeway|Highway}`. */
export interface TrafficLiveTraffics extends TrafficWrapperHeader {
  LiveTraffics: TrafficLiveTraffic[];
}

/** One step of a congestion scale (LevelItem). */
export interface TrafficCongestionLevelStep {
  /**
   * -1 = 道路封閉 (closed), 0 = 未知/資料不足 (unknown), 1 = 順暢 (free), 2 = 車多 (busy),
   * 3 = 壅塞 (congested), 4 = 嚴重壅塞 (heavy), 5 = 極度壅塞 (extreme). Taipei defines a 6th
   * level (`F`) beyond the spec.
   */
  Level: number;
  LevelName: string;
  /** Upper threshold of the measure (e.g. km/h); `-1` for the closed level. */
  TopValue?: number;
  /** Lower threshold; `-1` for the closed level. */
  LowValue?: number;
}

/** A congestion scale (CongestionLevel). */
export interface TrafficCongestionLevel {
  CongestionLevelID: string;
  SubAuthorityCode?: string;
  CongestionLevelName: string;
  Description?: string;
  MeasureIndex: TrafficMeasureIndex;
  Levels: TrafficCongestionLevelStep[];
}

/** Congestion scales — `GET /v2/Road/Traffic/CongestionLevel/{City/{City}|Freeway|Highway}`. */
export interface TrafficCongestionLevels extends TrafficWrapperHeader {
  CongestionLevels: TrafficCongestionLevel[];
}

/** Reference image of a camera's view (LookingView). */
export interface TrafficLookingView {
  Bearing?: TrafficBearing;
  /** Image URL. */
  Image?: string;
}

/** Traffic camera (CCTV). Member keys are required for the CCTV endpoints. */
export interface TrafficCCTV {
  CCTVID: string;
  SubAuthorityCode?: string;
  LinkID: string;
  LookingViews?: TrafficLookingView[];
  /** Live stream URL (HLS page or stream). */
  VideoStreamURL?: string;
  /** Snapshot URL. */
  VideoImageURL?: string;
  /** Snapshot refresh period in seconds. */
  ImageRefreshRate?: number;
  LocationType: TrafficLocationType;
  PositionLon: number;
  PositionLat: number;
  /** 1 = 路段 (section), 2 = 路口 (intersection), 3 = 匝道出入口 (ramp), 4 = 未定義. Taipei sends `-1`. */
  SurveillanceType?: number;
  SurveillanceDescription?: string;
  RoadID?: string;
  RoadName?: string;
  RoadClass?: TrafficRoadClass;
  RoadDirection?: string;
  RoadSection?: TrafficRoadSection;
  /** Mileage, e.g. `9K+020`. */
  LocationMile?: string;
  LayoutMapURL?: string;
}

/** Cameras — `GET /v2/Road/Traffic/CCTV/{City/{City}|Freeway|Highway}`. */
export interface TrafficCCTVs extends TrafficWrapperHeader {
  CCTVs: TrafficCCTV[];
}

/** A link a vehicle detector watches (DetectionLink). */
export interface TrafficDetectionLink {
  LinkID: string;
  Bearing?: TrafficBearing;
  RoadDirection: string;
  /** Lanes the detector covers. */
  LaneNum: number;
  /** Lanes the link actually has. */
  ActualLaneNum: number;
}

/** Vehicle detector (VD). */
export interface TrafficVD {
  VDID: string;
  SubAuthorityCode?: string;
  BiDirectional: TrafficFlag;
  DetectionLinks: TrafficDetectionLink[];
  VDType: TrafficVDType;
  LocationType?: TrafficLocationType;
  DetectionType: TrafficDetectionType;
  PositionLon: number;
  PositionLat: number;
  RoadID?: string;
  RoadName?: string;
  RoadClass?: TrafficRoadClass;
  RoadSection?: TrafficRoadSection;
  LocationMile?: string;
  LayoutMapURL?: string;
}

/** Vehicle detectors — `GET /v2/Road/Traffic/VD/{City/{City}|Freeway|Highway}`. */
export interface TrafficVDs extends TrafficWrapperHeader {
  VDs: TrafficVD[];
}

/** Flow of one vehicle class in a lane (Vehicle). */
export interface TrafficVehicleFlow {
  /** Vehicle class code: `S` 小型車 (car), `L` 大型車 (large), `T` 聯結車 (truck), `M` 機車 (motorcycle). */
  VehicleType: string;
  /** Vehicles counted in the period; `-99` = bad data. */
  Volume: number;
  /** Average speed in km/h; `-99` = bad data. */
  Speed?: number;
}

/** Flow in one lane (Lane). */
export interface TrafficLaneFlow {
  LaneID: number;
  LaneType: TrafficLaneType;
  /** Average speed in km/h; `-99` = bad data. */
  Speed: number;
  /** Occupancy in percent. */
  Occupancy: number;
  Vehicles: TrafficVehicleFlow[];
  /** Data-quality diagnostic, e.g. `diag0` when fine. */
  ErrorType?: string;
}

/** Flow on one link (LinkFlow). */
export interface TrafficLinkFlow {
  LinkID: string;
  Lanes: TrafficLaneFlow[];
}

/** Live reading of a vehicle detector (VDLive). */
export interface TrafficVDLive {
  VDID: string;
  SubAuthorityCode?: string;
  LinkFlows: TrafficLinkFlow[];
  Status: TrafficDeviceStatus;
  DataCollectTime: DateTimeString;
}

/** Live detector readings — `GET /v2/Road/Traffic/Live/VD/{City/{City}|Freeway|Highway}`. */
export interface TrafficVDLives extends TrafficWrapperHeader {
  VDLives: TrafficVDLive[];
}

/** Pair of eTag gantries forming a measured path (ETagPair). */
export interface TrafficETagPair {
  /** e.g. `01F0005S-01F0017S`. */
  ETagPairID: string;
  SubAuthorityCode?: string;
  StartETagGantryID: string;
  EndETagGantryID: string;
  /** e.g. `基隆端-基隆`. */
  Description: string;
  /** Path length in km. */
  Distance: number;
  StartLinkID?: string;
  EndLinkID?: string;
  LinkIDs?: TrafficLinkRef[];
  SectionID?: string;
  /** Path geometry as WKT (`LINESTRING (lon lat, …)`). */
  Geometry: string;
}

/** eTag pairs — `GET /v2/Road/Traffic/ETagPair/{City/{City}|Freeway|Highway}`. */
export interface TrafficETagPairs extends TrafficWrapperHeader {
  ETagPairs: TrafficETagPair[];
}

/** Travel time of one vehicle class between a gantry pair (Flow). */
export interface TrafficETagFlow {
  /** Vehicle class code (integer, per the spec's 車種代碼 table). */
  VehicleType: number;
  /** Average travel time in seconds; `-99` = bad data. */
  TravelTime: number;
  /** Standard deviation of the travel time in seconds; `-99` = bad data. */
  StandardDeviation: number;
  /** Space mean speed in km/h; `-99` = bad data. */
  SpaceMeanSpeed: number;
  /** Matched vehicles in the period. */
  VehicleCount: number;
}

/** Live travel times of a gantry pair (ETagPairLive). */
export interface TrafficETagPairLive {
  ETagPairID: string;
  SubAuthorityCode?: string;
  StartETagStatus: TrafficDeviceStatus;
  EndETagStatus: TrafficDeviceStatus;
  Flows: TrafficETagFlow[];
  StartTime: DateTimeString;
  EndTime: DateTimeString;
  DataCollectTime: DateTimeString;
}

/** Live eTag travel times — `GET /v2/Road/Traffic/Live/ETag/{City/{City}|Freeway|Highway}`. */
export interface TrafficETagPairLives extends TrafficWrapperHeader {
  ETagPairLives: TrafficETagPairLive[];
}

/** Traffic news item (News). */
export interface TrafficNews {
  NewsID: string;
  SubAuthorityCode?: string;
  /** e.g. `Zh_tw`. */
  Language: string;
  Department?: string;
  Title: string;
  NewsCategory: TrafficNewsCategory;
  /** Body text. Required by the spec; the freeway and highway feeds omit it. */
  Description?: string;
  NewsURL?: string;
  AttachmentURL?: string;
  PublishTime: DateTimeString;
  StartTime?: DateTimeString;
  EndTime?: DateTimeString;
  /** Last edit. The freeway feed sends the sentinel `0001-01-01T00:00:00+08:06`. */
  UpdateTime: DateTimeString;
}

/** News — `GET /v2/Road/Traffic/Live/News/{City/{City}|Freeway|Highway}`. */
export interface TrafficNewsList extends TrafficWrapperHeader {
  Newses: TrafficNews[];
}

/** Road authority (Authority). */
export interface TrafficAuthority {
  /** e.g. `NFB`, `THB`, `TPE`. */
  AuthorityCode?: string;
  NameZh_tw?: string;
  NameEn?: string;
}

/** Authorities — `GET /v2/Road/Traffic/Basic/Authority`. */
export interface TrafficAuthorities {
  /** `-1` = irregular. */
  UpdateInterval: number;
  Authorities: TrafficAuthority[];
}

/** Ramp of a freeway or highway event location (Ramp). */
export interface TrafficEventRamp {
  /** 北向, 南向, 東向 or 西向. */
  Direction?: string;
  /** 入口 (entry) or 出口 (exit). */
  EntryExit?: string;
}

/** Event location on a freeway, expressway or provincial road (FreeExpressHighway). */
export interface TrafficEventHighway {
  /** e.g. `國道一號`. */
  Road: string;
  /** 北向, 南向, 東向, 西向 or 雙向. */
  Direction?: string;
  /** e.g. `41K+500`. */
  StartKM: string;
  EndKM: string;
  SectionStart?: string;
  SectionEnd?: string;
  /** Interchange name, e.g. `林口`. */
  Interchange?: string;
  Ramp?: TrafficEventRamp;
}

/** One urban road of an event location (Roadway). */
export interface TrafficEventRoadway {
  City: string;
  Town: string;
  Road: string;
  Direction?: string;
  SectionStart?: string;
  SectionEnd?: string;
}

/** Urban roads of an event location (CityRoad). */
export interface TrafficEventCityRoad {
  Roadways: TrafficEventRoadway[];
}

/** Intersection of an event location (Intersection). */
export interface TrafficEventIntersection {
  City: string;
  Roads: string[];
}

/** Street address of an event location (Address). */
export interface TrafficEventAddress {
  City: string;
  Town: string;
  Road: string;
  Lane?: string;
  Alley?: string;
  StartNo: string;
  EndNo: string;
}

/** Landmark of an event location (Place). */
export interface TrafficEventPlace {
  POI: string;
}

/** Where an event is (Location). Taipei usually fills only `Other`; freeways fill `FreeExpressHighway`. */
export interface TrafficEventLocation {
  FreeExpressHighway?: TrafficEventHighway;
  CityRoad?: TrafficEventCityRoad;
  Intersection?: TrafficEventIntersection;
  Address?: TrafficEventAddress;
  Place?: TrafficEventPlace;
  /** Free-text location. */
  Other?: string;
}

/**
 * When traffic control applies (EventDuration). Planned events use `OccurType` and the
 * `Occur*` / `StartTime` / `EndTime` fields; live events use `DurationStartTime` / `DurationEndTime`.
 */
export interface TrafficEventDuration {
  /** 0 = Successive, 1 = Daily, 2 = Weekdays, 3 = Weekends, 4 = WeekendsAndHolidays, 5 = Others. */
  OccurType?: number;
  OccurDays?: number[];
  OccurDates?: string[];
  StartTime?: string;
  EndTime?: string;
  DurationStartTime?: DateTimeString;
  DurationEndTime?: DateTimeString;
}

/** Suggested detour (Detour). */
export interface TrafficEventDetour {
  Description: string;
  AttachmentURL: string;
  /** WKT geometry. */
  Geometry?: string;
}

/** Effect of an event on traffic (Impact). */
export interface TrafficEventImpact {
  Description: string;
  Severity?: TrafficSeverity;
  /** Control-measure codes per the spec's 交通管制措施 table; `[0]` = none. */
  Regulations: number[];
  BlockWay?: TrafficBlockWay;
  /** Blocked lanes; `"-1"` when none. */
  BlockedLanes: string;
  Duration?: TrafficEventDuration;
  Detour?: TrafficEventDetour;
}

/** Fields shared by planned and live road events. */
export interface TrafficEventBase {
  EventID: string;
  EventTitle: string;
  Description: string;
  EventType?: TrafficEventType;
  /** Sub-type code, e.g. 302 for exit congestion; see the spec's 事件次類別 table. */
  EventSubType?: number;
  /** Update sequence number of the event. */
  EventStep?: number;
  EffectiveTime?: DateTimeString;
  ExpireTime?: DateTimeString;
  /** Representative point as WKT, e.g. `POINT(121.36 25.06)`. */
  Positions?: string;
  /** Affected area as WKT. */
  Geometry?: string;
  LocationType?: TrafficEventLocationType;
  Location: TrafficEventLocation;
  Impact?: TrafficEventImpact;
  AttachmentURLs?: string[];
  /** Reporting source, e.g. `高公局北區交控中心`. */
  Source: string;
  PublishTime?: DateTimeString;
  LastUpdateTime?: DateTimeString;
}

/** Planned (announced) road event (Event). */
export interface TrafficEvent extends TrafficEventBase {
  WebURL?: string;
}

/** Planned events — `GET /v1/Traffic/RoadEvent/Event/{City/{City}|Highway}`. */
export interface TrafficEvents extends TrafficWrapperHeader {
  Events: TrafficEvent[];
}

/** Live road event (LiveEvent). */
export type TrafficLiveEvent = TrafficEventBase;

/** Live events — `GET /v1/Traffic/RoadEvent/LiveEvent/{City/{City}|Freeway|Highway}`. */
export interface TrafficLiveEvents extends TrafficWrapperHeader {
  LiveEvents: TrafficLiveEvent[];
}
