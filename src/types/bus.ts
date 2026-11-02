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
 * 91 = 去回不明 direction unknown, 98 = 偏移路線 off route, 99 = 非營運狀態 not in service,
 * 100 = 客滿 full, 101 = 包車出租 chartered, 255 = 未知 unknown.
 */
export type BusVehicleStatus = 0 | 1 | 2 | 3 | 4 | 5 | 90 | 91 | 98 | 99 | 100 | 101 | 255;

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

/** 進站離站: 0 = 離站 departing, 1 = 進站 arriving. */
export type BusA2EventType = 0 | 1;

/** 班次發車時間類型: 0 = 實際 actual, 1 = 預估 estimated, 2 = 無法推估 unknown. */
export type BusTripStartTimeType = 0 | 1 | 2;

/**
 * A vehicle arriving at or leaving a stop (BusA2Data, batch-updated) —
 * `GET /v2/Bus/RealTimeNearStop/City/{City}[/{RouteName}]` and `…/InterCity[/{RouteName}]`.
 * One record per vehicle, at the last stop it reached.
 */
export interface BusNearStop {
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
  Direction: BusDirection;
  StopUID?: string | null;
  StopID?: string | null;
  StopName?: NameType | null;
  StopSequence?: number | null;
  /** Sent by InterCity only. */
  MessageType?: BusMessageType | null;
  DutyStatus?: BusDutyStatus | null;
  BusStatus?: BusVehicleStatus | null;
  A2EventType?: BusA2EventType | null;
  /** GPS time of the arrival or departure. */
  GPSTime: DateTimeString;
  TripStartTimeType: BusTripStartTimeType;
  /** Departure time from the first stop. */
  TripStartTime?: DateTimeString | null;
  TransTime?: DateTimeString | null;
  SrcRecTime?: DateTimeString | null;
  /** Sent by InterCity (pushed) data only. */
  SrcTransTime?: DateTimeString | null;
  /** Sent by city (batch) data only. */
  SrcUpdateTime?: DateTimeString | null;
  /** TDX update time. */
  UpdateTime: DateTimeString;
}

/**
 * Route geometry of a (sub-)route in one direction (BusShape) —
 * `GET /v2/Bus/Shape/City/{City}[/{RouteName}]` and `…/InterCity[/{RouteName}]`.
 */
export interface BusShape {
  RouteUID: string;
  RouteID: string;
  RouteName: NameType;
  /** Required by the spec, but Taipei sends one shape per direction with no sub-route. */
  SubRouteUID?: string | null;
  SubRouteID?: string | null;
  /** `{}` in Taipei's feed. */
  SubRouteName?: Partial<NameType> | null;
  /** Missing when the source does not tell the directions apart. */
  Direction?: BusDirection | null;
  /** The path as well-known text, e.g. `LINESTRING (121.5 25.0, …)`. */
  Geometry: string;
  /** The path as an encoded polyline. */
  EncodedPolyline: string;
  UpdateTime: DateTimeString;
  /** Always `0`: shapes are not versioned. */
  VersionID: number;
}

/** Bus operator (Base.Operator) — `GET /v2/Bus/Operator/City/{City}` and `…/InterCity`. */
export interface BusOperator {
  /** Data provider platform ID. */
  ProviderID: string;
  OperatorID: string;
  OperatorName: NameType;
  OperatorPhone?: string | null;
  OperatorEmail?: string | null;
  OperatorUrl?: string | null;
  ReservationUrl?: string | null;
  ReservationPhone?: string | null;
  /** Operator code; `""` for some coach operators. */
  OperatorCode: string;
  /** Authority code (`THB` for coach operators). */
  AuthorityCode: string;
  /** Sub-authority, e.g. the regional motor vehicle office of a coach operator. */
  SubAuthorityCode?: string | null;
  /** Operator number (MOTC ticketing system). */
  OperatorNo: string;
  UpdateTime: DateTimeString;
}

/**
 * 車輛種類: 1 = 大型巴士 large, 2 = 中型巴士 medium, 3 = 小型巴士 small, 4 = 雙層巴士 double-decker,
 * 5 = 雙節巴士 articulated, 6 = 營業用小客車 car, 99 = 其他 other.
 */
export type BusVehicleClass = 1 | 2 | 3 | 4 | 5 | 6 | 99;

/** 車輛用途: 1 = 一般 regular, 2 = 復康巴士 accessible transport, 3 = 專車 dedicated, 4 = 其他 other. */
export type BusVehicleType = 1 | 2 | 3 | 4;

/** 讀卡機配置: 0 = 無 none, 1 = 前門刷卡 front door, 2 = 前後門刷卡 front and rear doors. */
export type BusCardReaderLayout = 0 | 1 | 2;

/**
 * A vehicle of a city's fleet (BusVehicleInfo) — `GET /v2/Bus/Vehicle/City/{City}`. Only
 * Taipei, NewTaipei, Taoyuan, Taichung, Tainan and Kaohsiung publish it.
 */
export interface BusVehicle {
  /** Plate number, to join with `BusPosition` and `BusNearStop`. */
  PlateNumb: string;
  OperatorID: string;
  OperatorCode: string;
  OperatorNo?: string | null;
  VehicleClass: BusVehicleClass;
  VehicleType: BusVehicleType;
  CardReaderLayout: BusCardReaderLayout;
  IsElectric: Flag;
  IsHybrid: Flag;
  IsLowFloor: Flag;
  HasLiftOrRamp: Flag;
  /** -1 = 未設定 not set, 0 = no, 1 = yes. */
  HasWifi: -1 | Flag;
  /** On-board unit ID. */
  InBoxID?: string | null;
  PurchaseTime?: DateTimeString | null;
  UpdateTime: DateTimeString;
}

/** 計費方式: 0 = 段次 by section, 1 = 起迄站間 by origin–destination, 2 = 計費站區間 by stage. */
export type BusFarePricingType = 0 | 1 | 2;

/**
 * 票種: 1 = 一般票 single, 2 = 來回票 return, 3 = 電子票證 smart card, 4 = 回數票 multi-ride,
 * 5 = 定期票30天 30-day pass, 6 = 定期票60天 60-day pass, 7 = 早鳥票 early bird, 8 = 定期票90天 90-day pass.
 */
export type BusTicketType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * 費率等級: 1 = 成人 adult, 2 = 學生 student, 3 = 孩童 child, 4 = 敬老 senior, 5 = 愛心 disabled,
 * 6 = 愛心孩童 disabled child, 7 = 愛心優待/愛心陪伴 companion, 8 = 團體 group, 9 = 軍警 military/police,
 * 10 = 半票 half fare (operator-defined).
 */
export type BusFareClass = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** A time window with a discounted fare (BusDiscountPeriods). Times are `HH:mm`. */
export interface BusDiscountPeriod {
  ServiceDay: BusServiceDay;
  StartTime: string;
  EndTime: string;
}

/** One price (BusFare). */
export interface BusFare {
  FareName?: string | null;
  TicketType: BusTicketType;
  FareClass: BusFareClass;
  /** Price in NT$; `-1` means the ticket is not sold. */
  Price: number;
  DiscountPeriods?: BusDiscountPeriod[] | null;
}

/** A stop named in a fare (BusRouteFareStop). Names are plain strings here. */
export interface BusRouteFareStop {
  StopID: string;
  StopName: string;
  Sequence?: number | null;
}

/** A buffer zone between two fare sections (SectionFareBufferZone). */
export interface BusFareBufferZone {
  ZoneID?: string | null;
  SectionSequence: number;
  Direction: BusDirection;
  FareBufferZoneOrigin: BusRouteFareStop;
  FareBufferZoneDestination: BusRouteFareStop;
  BufferZoneDescription?: string | null;
}

/** Fares charged per section (SectionFare), used when `FarePricingType` is 0. */
export interface BusSectionFare {
  BufferZones?: BusFareBufferZone[] | null;
  Fares: BusFare[];
}

/** Fare between two fare stages (BusStageFare), used when `FarePricingType` is 2. */
export interface BusStageFare {
  Direction: BusDirection;
  OriginStage: BusRouteFareStop;
  DestinationStage: BusRouteFareStop;
  Fares: BusFare[];
}

/** Fare between two stops (BusODFare), used when `FarePricingType` is 1. */
export interface BusODFare {
  Direction: BusDirection;
  OriginStop: BusRouteFareStop;
  DestinationStop: BusRouteFareStop;
  Fares: BusFare[];
}

/**
 * Fares of a (sub-)route (BusRouteFare) — `GET /v2/Bus/RouteFare/City/{City}[/{RouteName}]`
 * and `…/InterCity[/{RouteName}]`. Unlike the other bus types, `RouteName` and `SubRouteName`
 * are plain strings. Which fare list is filled depends on `FarePricingType`.
 */
export interface BusRouteFare {
  RouteID: string;
  RouteName?: string | null;
  OperatorID: string;
  OperatorNo?: string | null;
  SubRouteID?: string | null;
  SubRouteName?: string | null;
  FarePricingType: BusFarePricingType;
  IsFreeBus: Flag;
  /** Whether these fares apply to every sub-route of the route. */
  IsForAllSubRoutes: Flag;
  SectionFares?: BusSectionFare[] | null;
  StageFares?: BusStageFare[] | null;
  ODFares?: BusODFare[] | null;
  UpdateTime: DateTimeString;
}

/** Days a first/last trip pair applies to (BusFirstLastTripInfoServiceDay); 1 = applies. */
export interface BusFirstLastTripServiceDay extends BusServiceDay {
  DayBeforeNationalHoliday?: Flag;
  DayAfterNationalHoliday?: Flag;
  TyphoonDay?: Flag;
}

/** First and last departure on the given days (FirstLastTrip). Times are `HH:mm`. */
export interface BusFirstLastTrip {
  ServiceDay: BusFirstLastTripServiceDay;
  FirstTripDepTime: string;
  LastTripDepTime: string;
}

/**
 * First and last trips of a sub-route in one direction (BusFirstLastTripInfo) —
 * `GET /v2/Bus/FirstLastTripInfo/City/{City}[/{RouteName}]` and `…/InterCity`. Taipei,
 * NewTaipei and Tainan do not publish it.
 */
export interface BusFirstLastTripInfo {
  RouteUID: string;
  RouteID: string;
  RouteName: NameType;
  OperatorID: string;
  OperatorNo?: string | null;
  SubRouteUID: string;
  SubRouteID: string;
  SubRouteName: NameType;
  Direction: BusDirection;
  FirstLastTrips: BusFirstLastTrip[];
  UpdateTime: DateTimeString;
  VersionID: number;
}

/** A stop as shown on a route map (Embedded.Stop, without the `StationGroupID` Taipei omits). */
export interface BusDisplayStop extends Omit<BusStop, 'StationGroupID'> {
  /** Required by the spec, but missing in Taipei's feed. */
  StationGroupID?: string | null;
}

/**
 * Stops of a route in one direction as the operator displays them, without sub-routes
 * (BusDisplayStopOfRoute) — `GET /v2/Bus/DisplayStopOfRoute/City/{City}[/{RouteName}]`.
 */
export interface BusDisplayStopOfRoute {
  RouteUID: string;
  RouteID: string;
  RouteName: NameType;
  Direction?: BusDirection | null;
  Stops: BusDisplayStop[];
  UpdateTime: DateTimeString;
  VersionID: number;
}
