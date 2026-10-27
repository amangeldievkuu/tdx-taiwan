// Bus types, transcribed from the TDX 公共運輸-公車 v2 OpenAPI spec
// (PTX.Service.DTO.Bus.Specification.V2.*).
import type { DateTimeString, Flag, NameType, OpenString, PointType } from './common.js';

/** `City` path values accepted by the city bus endpoints. */
export type BusCity = OpenString<
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
  | 'ChiayiCounty'
  | 'Chiayi'
  | 'PingtungCounty'
  | 'YilanCounty'
  | 'HualienCounty'
  | 'TaitungCounty'
  | 'KinmenCounty'
  | 'PenghuCounty'
  | 'LienchiangCounty'
>;

/** 公車路線類別: 11 = 市區公車 city bus, 12 = 公路客運 highway, 13 = 國道客運 freeway, 14 = 接駁車 shuttle. */
export type BusRouteType = 11 | 12 | 13 | 14;

/** 去返程: 0 = 去程 outbound, 1 = 返程 inbound, 2 = 迴圈 loop, 10 = 循環線 circular, 255 = 未知 unknown. */
export type BusDirection = 0 | 1 | 2 | 10 | 255;

/** 車輛狀態: 0 = 正常, 1 = 尚未發車 not departed, 2 = 交管不停靠 not stopping, 3 = 末班車已過 last bus passed, 4 = 今日未營運 not operating today. */
export type BusStopStatus = 0 | 1 | 2 | 3 | 4;

/** 資料型態: 0 = 未知 unknown, 1 = 定期 scheduled, 2 = 非定期 unscheduled. */
export type BusMessageType = 0 | 1 | 2;

/** 上下車站別: -1 = 可下車 alight only, 0 = 可上下車 board & alight, 1 = 可上車 board only. */
export type BusStopBoarding = -1 | 0 | 1;

/** 進離站: 0 = 離站 departing, 1 = 進站 arriving. */
export type VehicleStopStatus = 0 | 1;

/** Route operator (Embedded.RouteOperator). */
export interface RouteOperator {
  OperatorID: string;
  OperatorName: NameType;
  OperatorCode?: string | null;
  /** Operator number as defined by the MOTC ticketing system. */
  OperatorNo: string;
}

/** Sub-route (BusSubRoute). */
export interface BusSubRoute {
  /** Unique sub-route ID: {AuthorityCode} + {SubRouteID}. */
  SubRouteUID: string;
  SubRouteID: string;
  OperatorIDs: string[];
  SubRouteName: NameType;
  /** Headsign (車頭描述). */
  Headsign?: string | null;
  HeadsignEn?: string | null;
  Direction: BusDirection;
  /** First departure on weekdays (HH:mm). */
  FirstBusTime?: string | null;
  /** Spec description: 平日返程第一班發車時間. */
  LastBusTime?: string | null;
  /** First departure on holidays (HH:mm). */
  HolidayFirstBusTime?: string | null;
  /** Spec description: 假日返程第一班發車時間. */
  HolidayLastBusTime?: string | null;
  DepartureStopNameZh?: string | null;
  DepartureStopNameEn?: string | null;
  DestinationStopNameZh?: string | null;
  DestinationStopNameEn?: string | null;
}

/** Bus route (BusRoute) — `GET /v2/Bus/Route/City/{City}[/{RouteName}]`. */
export interface BusRoute {
  /** Unique route ID: {AuthorityCode} + {RouteID}. */
  RouteUID: string;
  RouteID: string;
  /** Whether the route actually has multiple sub-routes. */
  HasSubRoutes: boolean;
  Operators: RouteOperator[];
  AuthorityID: string;
  ProviderID: string;
  SubRoutes?: BusSubRoute[] | null;
  BusRouteType: BusRouteType;
  RouteName: NameType;
  DepartureStopNameZh?: string | null;
  DepartureStopNameEn?: string | null;
  DestinationStopNameZh?: string | null;
  DestinationStopNameEn?: string | null;
  TicketPriceDescriptionZh?: string | null;
  TicketPriceDescriptionEn?: string | null;
  FareBufferZoneDescriptionZh?: string | null;
  FareBufferZoneDescriptionEn?: string | null;
  RouteMapImageUrl?: string | null;
  /** Owning city (empty for highway/freeway routes). */
  City?: string | null;
  /** ISO 3166-2 three-letter city code. */
  CityCode?: string | null;
  UpdateTime: DateTimeString;
  VersionID: number;
}

/** Stop on a route (Embedded.Stop). */
export interface BusStop {
  /** Unique stop ID: {AuthorityCode} + {StopID}. */
  StopUID: string;
  StopID: string;
  StopName: NameType;
  StopBoarding?: BusStopBoarding | null;
  /** Order of the stop along the route. */
  StopSequence: number;
  StopPosition: PointType;
  StationID?: string | null;
  StationGroupID: string;
  LocationCityCode?: string | null;
}

/** Stops of a (sub-)route (BusStopOfRoute) — `GET /v2/Bus/StopOfRoute/City/{City}/{RouteName}`. */
export interface BusStopOfRoute {
  RouteUID: string;
  RouteID: string;
  RouteName: NameType;
  Operators?: RouteOperator[] | null;
  SubRouteUID: string;
  SubRouteID: string;
  SubRouteName: NameType;
  Direction?: BusDirection | null;
  City?: string | null;
  CityCode?: string | null;
  Stops: BusStop[];
  UpdateTime: DateTimeString;
  VersionID: number;
}

/** Per-vehicle estimate (N1.Estimate). */
export interface BusEstimate {
  PlateNumb?: string | null;
  /** Estimated seconds until arrival. */
  EstimateTime?: number | null;
  IsLastBus?: boolean | null;
  VehicleStopStatus?: VehicleStopStatus | null;
}

/**
 * Estimated time of arrival (BusN1EstimateTime) —
 * `GET /v2/Bus/EstimatedTimeOfArrival/City/{City}/{RouteName}`.
 */
export interface BusEstimatedTimeOfArrival {
  /** Plate number; `-1` means no vehicle is currently serving this stop. */
  PlateNumb?: string | null;
  StopUID?: string | null;
  StopID?: string | null;
  StopName?: NameType | null;
  RouteUID?: string | null;
  RouteID?: string | null;
  RouteName?: NameType | null;
  SubRouteUID?: string | null;
  SubRouteID?: string | null;
  SubRouteName?: NameType | null;
  /** Direction of the vehicle's current trip (not of the stop). */
  Direction: BusDirection;
  /**
   * Estimated seconds until arrival. `null` when `StopStatus` is 2–4 or `PlateNumb` is `-1`.
   * When `StopStatus` is 1, some cities give the time until departure instead.
   */
  EstimateTime?: number | null;
  /** Scheduled time (HH:mm). */
  ScheduledTime?: string | null;
  /** Number of stops between the vehicle and this stop. */
  StopCountDown?: number | null;
  CurrentStop?: string | null;
  DestinationStop?: string | null;
  StopSequence?: number | null;
  StopStatus?: BusStopStatus | null;
  MessageType?: BusMessageType | null;
  /** Next bus arrival time. */
  NextBusTime?: DateTimeString | null;
  IsLastBus?: boolean | null;
  Estimates?: BusEstimate[] | null;
  /** When the estimate was computed (only provided by some sources). */
  DataTime?: DateTimeString | null;
  TransTime?: DateTimeString | null;
  SrcRecTime?: DateTimeString | null;
  SrcTransTime?: DateTimeString | null;
  SrcUpdateTime?: DateTimeString | null;
  /** TDX update time. */
  UpdateTime: DateTimeString;
}

/** 勤務狀態: 0 = 正常 normal, 1 = 開始 start of duty, 2 = 結束 end of duty. */
export type BusDutyStatus = 0 | 1 | 2;

/**
 * 行車狀況 (the vehicle's `BusStatus`): 0 = 正常 normal, 1 = 車禍 accident, 2 = 故障 breakdown,
 * 3 = 塞車 congestion, 4 = 緊急求援 emergency, 5 = 加油 refuelling, 90 = 不明 unknown,
 * 91 = 去回不明 direction unknown, 98 = 偏移路線 off route, 99 = 非營運狀態 not in service.
 */
export type BusVehicleStatus = 0 | 1 | 2 | 3 | 4 | 5 | 90 | 91 | 98 | 99;

/**
 * Stop of a city (V2.BusStop) — `GET /v2/Bus/Stop/City/{City}`. Not to be confused with
 * {@link BusStop}, the stop embedded in `BusStopOfRoute`.
 */
export interface BusStopInfo {
  /** Unique stop ID: {AuthorityCode} + {StopID}. */
  StopUID: string;
  StopID: string;
  AuthorityID: string;
  StopName: NameType;
  StopPosition: PointType;
  StopAddress?: string | null;
  /** Direction of travel at the stop: E, W, S, N, SE, NE, SW or NW. */
  Bearing?: string | null;
  StationID?: string | null;
  /** Station group ID. Required by the spec, but missing for Taipei and Kaohsiung stops. */
  StationGroupID?: string;
  StopDescription?: string | null;
  /** City that manages the stop (the `City` path value); empty for highway routes. */
  City?: string | null;
  /** ISO 3166-2 code of the managing city, e.g. `TPE`. */
  CityCode?: string | null;
  /** ISO 3166-2 code of the city the stop is located in. */
  LocationCityCode?: string | null;
  /** TDX update time. */
  UpdateTime: DateTimeString;
  VersionID: number;
}

/** A route's stop at a station (StationStop). */
export interface BusStationStop {
  StopUID: string;
  StopID: string;
  StopName: NameType;
  RouteUID: string;
  RouteID: string;
  RouteName: NameType;
}

/**
 * Station (V2.BusStation) — `GET /v2/Bus/Station/City/{City}` and `/v2/Bus/Station/InterCity`.
 * A station is one place where buses stop, in one direction; `Stops` lists the stop of each
 * route that serves it.
 */
export interface BusStation {
  /** Unique station ID: {AuthorityCode} + {StationID}. */
  StationUID: string;
  StationID: string;
  /** Live data has only `Zh_tw`; the stops carry English names. */
  StationName: NameType;
  StationPosition: PointType;
  /** Missing for Kaohsiung stations. */
  StationAddress?: string | null;
  /** Required by the spec, but only InterCity stations have one. */
  StationGroupID?: string;
  Stops?: BusStationStop[];
  /** ISO 3166-2 code of the city the station is in, e.g. `TPE`. */
  LocationCityCode?: string | null;
  /** Direction of travel at the station: E, W, S, N, SE, NE, SW or NW. */
  Bearing?: string | null;
  UpdateTime: DateTimeString;
  VersionID: number;
}

/**
 * Live vehicle position, reported at regular intervals (BusA1Data) —
 * `GET /v2/Bus/RealTimeByFrequency/City/{City}/{RouteName}` and `…/InterCity/{RouteName}`.
 */
export interface BusPosition {
  /** Plate number. */
  PlateNumb: string;
  OperatorID?: string | null;
  /** Operator number (MOTC ticketing system). */
  OperatorNo?: string | null;
  RouteUID?: string | null;
  RouteID?: string | null;
  RouteName?: NameType | null;
  SubRouteUID?: string | null;
  SubRouteID?: string | null;
  SubRouteName?: NameType | null;
  Direction?: BusDirection | null;
  BusPosition?: PointType | null;
  /** Speed in km/h. */
  Speed?: number | null;
  /** Heading in degrees. */
  Azimuth?: number | null;
  DutyStatus?: BusDutyStatus | null;
  BusStatus?: BusVehicleStatus | null;
  MessageType?: BusMessageType | null;
  /** Time on the vehicle's GPS unit. */
  GPSTime: DateTimeString;
  TransTime?: DateTimeString | null;
  SrcRecTime?: DateTimeString | null;
  SrcTransTime?: DateTimeString | null;
  SrcUpdateTime?: DateTimeString | null;
  /** TDX update time. */
  UpdateTime: DateTimeString;
}

/** Days of the week a trip or frequency band runs (ServiceDay); 1 = runs. */
export interface BusServiceDay {
  ServiceTag?: string;
  Sunday: Flag;
  Monday: Flag;
  Tuesday: Flag;
  Wednesday: Flag;
  Thursday: Flag;
  Friday: Flag;
  Saturday: Flag;
  /** In the spec but never sent in live data. */
  NationalHolidays?: Flag;
}

/** A run of dates (DatePeriod), `yyyy-MM-dd`. */
export interface BusDatePeriod {
  StartDate?: string;
  EndDate?: string;
}

/** 營運服務狀態: 0 = 正常營運 (normal), 1 = 加班營運 (extra), 2 = 取消/停駛 (cancelled). */
export type BusSpecialDayStatus = 0 | 1 | 2;

/** Dates that differ from the weekly pattern (SpecialDay). */
export interface BusSpecialDay {
  /** Separate dates, `yyyy-MM-dd`. */
  Dates?: string[];
  DatePeriod?: BusDatePeriod;
  ServiceStatus?: BusSpecialDayStatus;
  Description?: string;
}

/** A trip's call at a stop (BusStopTime). Times are `HH:mm`. */
export interface BusScheduleStopTime {
  StopSequence: number;
  StopUID: string;
  StopID: string;
  StopName: NameType;
  ArrivalTime: string;
  DepartureTime: string;
}

/** One scheduled trip (BusTimetable). */
export interface BusTimetable {
  TripID?: string;
  /** Sent by InterCity schedules only. */
  IsLowFloor?: boolean;
  ServiceDay?: BusServiceDay;
  SpecialDays?: BusSpecialDay[];
  StopTimes: BusScheduleStopTime[];
}

/** A headway band, for routes run by frequency rather than fixed trips (BusFrequency). */
export interface BusFrequency {
  /** `HH:mm`. */
  StartTime: string;
  EndTime: string;
  MinHeadwayMins: number;
  MaxHeadwayMins: number;
  ServiceDay?: BusServiceDay;
  SpecialDays?: BusSpecialDay[];
}

/**
 * Schedule of a sub-route in one direction (V2.BusSchedule) — `GET /v2/Bus/Schedule/City/{City}`
 * and `/v2/Bus/Schedule/InterCity`. A sub-route has fixed trips (`Timetables`, each with every
 * stop's time) or headway bands (`Frequencys`, sic). Kaohsiung publishes no schedules.
 */
export interface BusSchedule {
  RouteUID: string;
  RouteID: string;
  RouteName: NameType;
  SubRouteUID: string;
  SubRouteID: string;
  SubRouteName: NameType;
  Direction: BusDirection;
  /** InterCity only. */
  OperatorID?: string;
  OperatorCode?: string;
  OperatorNo?: string;
  Timetables?: BusTimetable[];
  /** The spec's spelling. */
  Frequencys?: BusFrequency[];
  UpdateTime: DateTimeString;
  VersionID: number;
}

/** 營運狀況: 0 = 全部營運停止 (suspended), 1 = 全部營運正常 (normal), 2 = 有異常狀況 (disrupted). */
export type BusAlertStatus = 0 | 1 | 2;

/**
 * 原因: 1 事故 accident, 2 維護檢修 maintenance, 3 技術問題 technical problem, 4 施工 construction,
 * 5 醫療緊急狀況 medical emergency, 6 氣候 weather, 7 示威遊行 demonstration, 8 政治活動/維安
 * police activity, 9 假日/節慶 holiday, 10 罷工 strike, 11 活動 event, 254 其他, 255 未知.
 */
export type BusAlertCause = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 254 | 255;

/**
 * 影響: 1 改道/站牌不停靠 detour, 2 班次增加 extra service, 3 班次減少 reduced service, 4 班次取消
 * no service, 5 班次改變 modified service, 6 站點異動 stop moved, 7 重大延遲 significant delays,
 * 254 其他, 255 未知.
 */
export type BusAlertEffect = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 254 | 255;

/** What an alert affects (Scope). Every list is optional. */
export interface BusAlertScope {
  Operators?: Array<{ OperatorID?: string; OperatorName?: NameType }>;
  Stops?: Array<{ StopID?: string; StopName?: NameType; StationID?: string }>;
  Stations?: Array<{ StationID?: string; StationName?: NameType }>;
  Routes?: Array<{ RouteID?: string; RouteName?: NameType; Direction?: BusDirection }>;
  SubRoutes?: Array<{ SubRouteID?: string; SubRouteName?: NameType; Direction?: BusDirection }>;
  Trips?: Array<{
    TripID?: string;
    RouteID?: string;
    SubRouteID?: string;
    Direction?: BusDirection;
    /** `HH:mm` at the first stop. */
    TripDepTime?: string;
  }>;
}

/** Service alert (V2.BusAlert) — `GET /v2/Bus/Alert/City/{City}` and `/v2/Bus/Alert/InterCity`. */
export interface BusAlert {
  AlertID: string;
  Title: string;
  Description: string;
  Department: string;
  Status?: BusAlertStatus;
  Cause?: BusAlertCause;
  Effect?: BusAlertEffect;
  Scope: BusAlertScope;
  AlertURL?: string;
  PublishTime?: DateTimeString;
  StartTime: DateTimeString;
  EndTime: DateTimeString;
  SrcUpdateTime?: DateTimeString;
  UpdateTime?: DateTimeString;
}

/**
 * 消息類別: 1 最新消息 news, 2 新聞稿 press release, 3 營運資訊 operations, 4 轉乘資訊 transfers,
 * 5 活動訊息 events, 6 系統公告 system notice, 7 通阻資訊 disruptions, 99 其他.
 */
export type BusNewsCategory = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 99;

/** News item (V2.BusNews) — `GET /v2/Bus/News/City/{City}` and `/v2/Bus/News/InterCity`. */
export interface BusNews {
  NewsID: string;
  Language: string;
  Department?: string;
  Title: string;
  NewsCategory?: BusNewsCategory;
  Description: string;
  ContactName?: string;
  /** `""` in Taipei's feed. */
  ContactPhone?: string;
  NewsURL?: string;
  AttachmentURL?: string;
  PublishTime: DateTimeString;
  StartTime: DateTimeString;
  EndTime: DateTimeString;
  SrcUpdateTime?: DateTimeString;
  UpdateTime: DateTimeString;
}
