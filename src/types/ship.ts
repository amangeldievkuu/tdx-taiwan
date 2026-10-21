// Ferry and ship types, transcribed from the TDX 公共運輸-航運 v3 OpenAPI spec
// (PTX.Service.DTO.Ship.Specification.V3.*). Every endpoint wraps its items in an object; live
// data names the array per kind (`Ports`, `Routes`, `ShipLiveBoardses`, …) where the spec says
// `Items`, and never sends `Count`. Where live data contradicts the spec, the type follows the
// data and says so; the observations come from checking every endpoint on 2026-10-21. Optional
// (`?`) means the field is not in the schema's `required` list; the spec marks nothing nullable.
import type { DateTimeString, OpenString, PointType } from './common.js';

/** Multilingual name as the ship endpoints return it (NameType); both parts optional. */
export interface ShipName {
  Zh_tw?: string;
  En?: string;
}

/** Port name as the live board spells it: `ZhTw`, unlike every other ship name. */
export interface ShipLiveBoardName {
  ZhTw?: string;
  En?: string;
}

/**
 * `City` path values of the `Domestic/City/{City}` endpoints, which carry the routes run by
 * county and city governments (disjoint from the nationwide feed). Checked 2026-10-21:
 * - routes, operators, vessels, stops, fares, schedules, news: NewTaipei, NantouCounty,
 *   PingtungCounty, TaitungCounty, KinmenCounty, PenghuCounty, LienchiangCounty, Taipei,
 *   Kaohsiung (data only for PenghuCounty, Kaohsiung, NewTaipei, Taipei and KinmenCounty)
 * - live board: LienchiangCounty only
 * TDX answers an unsupported city with a 400 `TdxApiError` listing the accepted ones.
 */
export type ShipCity = OpenString<
  | 'Taipei'
  | 'NewTaipei'
  | 'Kaohsiung'
  | 'NantouCounty'
  | 'PingtungCounty'
  | 'TaitungCounty'
  | 'KinmenCounty'
  | 'PenghuCounty'
  | 'LienchiangCounty'
>;

/** Port ID, e.g. `TWMZG` 馬公, `TW001` 小琉球白沙港, `TWSHT` 金門水頭, `TWKEL` 基隆港. */
export type ShipPortId = string;

/** Route ID, e.g. `FGGI` 富岡–綠島, `KLMT` 基隆–馬祖; city feeds use `2048`, `KHH005`, `ZH101`. */
export type ShipRouteId = string;

/**
 * 航線種類: 1 = 國內航線 (domestic ferry / blue highway), 2 = 離島航線 (outlying islands),
 * 3 = 兩岸航線 (cross-strait), 4 = 小三通航線 (Mini Three Links), 254 = 其他.
 */
export type ShipRouteType = 1 | 2 | 3 | 4 | 254;

/** 方向性: 0 = 去程 (outbound), 1 = 返程 (return), 2 = 迴圈 (loop). */
export type ShipDirection = 0 | 1 | 2;

/** 營運狀態: 0 = 非營運中 (not operating), 1 = 營運中 (operating). */
export type ShipServiceStatus = 0 | 1;

/** 0 = 否 (no), 1 = 是 (yes). */
export type ShipFlag = 0 | 1;

/** 票種類型: 1 = 一般票 (single), 2 = 來回票 (return), 3 = 電子票證 (e-ticket), 4 = 回數票 (multi-ride). */
export type ShipTicketType = 1 | 2 | 3 | 4;

/**
 * 費率等級: 1 = 成人 (adult), 2 = 學生 (student), 3 = 孩童 (child), 4 = 敬老 (senior),
 * 5 = 愛心 (disabled), 6 = 愛心孩童 (disabled child), 7 = 愛心優待或愛心陪伴 (companion),
 * 8 = 團體 (group), 9 = 軍警 (military/police). Live data also uses 254 (其他, e.g. an
 * insurance-only ticket), so the type is a plain number.
 */
export type ShipFareClass = number;

/** 售票狀態: 1 = 尚有空位 (available), 2 = 座位有限 (limited), 3 = 已售完 (sold out), 4 = 開放候補 (waitlist), 5 = 停止劃位 (closed). */
export type ShipSeatStatus = 1 | 2 | 3 | 4 | 5;

/** 航班行駛狀態: 1 = 航班正常 (normal), 2 = 航班駛離 (departed), 3 = 航班誤點 (delayed), 4 = 航班停航 (cancelled). */
export type ShipSailingStatus = 1 | 2 | 3 | 4;

/** 營運狀況: 0 = 全線營運停止 (suspended), 1 = 全線營運正常 (normal), 2 = 有異常狀況 (disruption). */
export type ShipAlertStatus = 0 | 1 | 2;

/** 影響等級: 1 = 重度 (severe), 2 = 中度 (moderate), 3 = 輕度 (minor). */
export type ShipAlertLevel = 1 | 2 | 3;

/**
 * 影響: 1 = 船舶改道 (rerouted), 2 = 服務班次增加 (extra sailings), 3 = 服務班次減少 (fewer),
 * 4 = 服務班次取消 (cancelled), 5 = 服務班次改變 (changed), 6 = 站牌不停靠 (port skipped),
 * 7 = 重大延遲 (major delay), 254 = 其他, 255 = 未知原因.
 */
export type ShipAlertEffect = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 254 | 255;

/**
 * 消息類別: 1 = 最新消息, 2 = 新聞稿, 3 = 營運資訊, 4 = 轉乘資訊, 5 = 活動訊息, 6 = 系統公告,
 * 7 = 通阻資訊, 99 = 其他.
 */
export type ShipNewsCategory = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 99;

/**
 * Time of day in a timetable, **not zero-padded** (`6:15`, `15:00`). `ArrivalTime` is `""` at
 * the first stop of a trip.
 */
export type ShipTime = string;

/** Service date: `YYYY-MM-DD` from the nationwide feed, `YYYY/MM/DD` from the city feeds. */
export type ShipDate = string;

/**
 * Fields of the static wrappers (ports, routes, schedules, fares…). `Count` is never sent;
 * `UpdateTime` and `AuthorityCode` are optional in the spec but present in live data.
 */
export interface ShipStaticWrapperHeader {
  UpdateTime?: DateTimeString;
  /** TDX refresh period in seconds; `-1` = irregular. */
  UpdateInterval: number;
  /** Authority code: `MPB` (航港局) nationwide, `PEN`, `KHH`, `NWT`, `TPE`, `KIN` for city feeds. */
  AuthorityCode?: string;
  VersionID: number;
  SrcUpdateTime?: DateTimeString;
  /** Source refresh period in seconds; `-1` = irregular. */
  SrcUpdateInterval?: number;
  /** In the spec but never sent. */
  Count?: number;
}

/** Fields of the live wrappers (live boards, positions, seats, alerts, news). */
export interface ShipLiveWrapperHeader {
  UpdateTime: DateTimeString;
  UpdateInterval: number;
  SrcUpdateTime: DateTimeString;
  SrcUpdateInterval: number;
  AuthorityCode: string;
  /** In the spec but never sent. */
  Count?: number;
}

/** Port (Port). */
export interface ShipPort {
  PortID: ShipPortId;
  PortCode?: string;
  PortName: ShipName;
  PortPosition: PointType;
  PortAddress?: string;
  PortPhone?: string;
  /** City in Chinese, e.g. `澎湖縣`. */
  City: string;
  /** City abbreviation, e.g. `KHH`. */
  CityCode: string;
  /** Required by the spec but never sent. */
  Country?: string;
  /** Required by the spec but never sent. */
  CountryCode?: string;
  PortURL?: string;
}

/** Ports — `GET /v3/Ship/Port`. */
export interface ShipPorts extends ShipStaticWrapperHeader {
  Ports: ShipPort[];
}

/** Period a route is out of service (NonServicePeriod). */
export interface ShipNonServicePeriod {
  StartDate?: string;
  EndDate?: string;
}

/** Operator reference on a route (Operators). */
export interface ShipRouteOperator {
  OperatorID: string;
}

/** Vessel reference on a route (Vessels). */
export interface ShipRouteVessel {
  VesselID: string;
  VesselName: ShipName;
}

/** Ferry route (Route). */
export interface ShipRoute {
  RouteID: ShipRouteId;
  RouteName: ShipName;
  ServiceStatus?: ShipServiceStatus;
  NonServicePeriod?: ShipNonServicePeriod;
  Description: string;
  Operators: ShipRouteOperator[];
  StartPortID: ShipPortId;
  /** Plain text, e.g. `後壁湖漁港`. */
  StartPortName: string;
  EndPortID: ShipPortId;
  EndPortName: string;
  TicketPriceDescription: ShipName;
  RouteType: ShipRouteType;
  Vessels?: ShipRouteVessel[];
  RouteMapURL?: string;
  /** Distance in nautical miles. */
  RouteDistance: number;
  WeatherURL: string;
}

/** Routes — `GET /v3/Ship/Route` and `/v3/Ship/Route/Domestic/City/{City}`. */
export interface ShipRoutes extends ShipStaticWrapperHeader {
  Routes: ShipRoute[];
}

/** Operator (Operator). Every field is optional in the spec. */
export interface ShipOperator {
  OperatorID?: string;
  OperatorName?: ShipName;
  OperatorPhone?: string;
  OperatorEmail?: string;
  OperatorAddress?: string;
  OperatorURL?: string;
  FareURL?: string;
  ReservationURL?: string;
  ReservationPhone?: string;
  OperatorLogoURL?: string;
  /** Business registration number (spelt `Adminstration` in the spec). */
  BusinessAdminstrationNo?: string;
}

/** Operators — `GET /v3/Ship/Operator` and `/v3/Ship/Operator/Domestic/City/{City}`. */
export interface ShipOperators extends ShipStaticWrapperHeader {
  Operators: ShipOperator[];
}

/** Vessel (Vessel). */
export interface ShipVessel {
  VesselID: string;
  /** AIS identifier. */
  MMSI?: string;
  IMO?: string;
  /** Taiwan vessel number. */
  VesselNo?: string;
  CallSign?: string;
  VesselName: ShipName;
  /** Country code, e.g. `TW`. */
  Nationality: string;
  OperatorID: string;
  GrossTonnage?: number;
  /** Length in metres. */
  Length?: number;
  /** Width in metres. */
  Width?: number;
  MaxPassengerCount?: number;
  VesselClass?: string;
  /** Draft in metres. */
  LoadDraft?: number;
  Note?: string;
}

/** Vessels — `GET /v3/Ship/Vessel` and `/v3/Ship/Vessel/Domestic/City/{City}`. */
export interface ShipVessels extends ShipStaticWrapperHeader {
  Vessels: ShipVessel[];
}

/** Port call in a route's stop sequence (Stops). */
export interface ShipStop {
  StopSequence: number;
  PortID: ShipPortId;
  PortName: ShipName;
}

/** Ordered ports of a route in one direction (StopOfRoute). */
export interface ShipStopOfRoute {
  RouteID: ShipRouteId;
  RouteName: ShipName;
  Operators: ShipRouteOperator[];
  Direction: ShipDirection;
  Stops: ShipStop[];
}

/** Stop sequences — `GET /v3/Ship/StopOfRoute` and `/v3/Ship/StopOfRoute/Domestic/City/{City}`. */
export interface ShipStopOfRoutes extends ShipStaticWrapperHeader {
  StopOfRoutes: ShipStopOfRoute[];
}

/** Port reference in a fare (PortInformation). */
export interface ShipFarePort {
  PortID: ShipPortId;
  PortName: ShipName;
}

/** One fare (Fare). */
export interface ShipFare {
  FareName: string;
  TicketType: ShipTicketType;
  FareClass: ShipFareClass;
  CabinClass?: string;
  /** Price in NT$. */
  Price: number;
}

/** Fares between two ports in one direction (ODFare). `Fares` can be empty. */
export interface ShipODFare {
  Direction: ShipDirection;
  OriginPort?: ShipFarePort;
  DestinationPort?: ShipFarePort;
  Fares: ShipFare[];
}

/** Fares of a route (RouteFare). */
export interface ShipRouteFare {
  RouteID: ShipRouteId;
  RouteName: ShipName;
  OperatorID: string;
  FareID?: string;
  ODFares: ShipODFare[];
}

/** Fares — `GET /v3/Ship/ODFare` and `/v3/Ship/ODFare/Domestic/City/{City}`. */
export interface ShipRouteFares extends ShipStaticWrapperHeader {
  RouteFares: ShipRouteFare[];
}

/** Port call of a scheduled trip (StopTime). */
export interface ShipStopTime {
  StopSequence: number;
  PortID: ShipPortId;
  PortName: ShipName;
  /** `""` at the first port. */
  ArrivalTime: ShipTime;
  DepartureTime: ShipTime;
  /** Sailing time to the next port in minutes. */
  TravelTime: number;
}

/** Days a trip or frequency runs (ServiceDay). */
export interface ShipServiceDay {
  ServiceTag?: string;
  Monday: ShipFlag;
  Tuesday: ShipFlag;
  Wednesday: ShipFlag;
  Thursday: ShipFlag;
  Friday: ShipFlag;
  Saturday: ShipFlag;
  Sunday: ShipFlag;
  NationalHolidays?: ShipFlag;
}

/** One trip of a timetable (TimeTable / GeneralTimeTable). `ServiceDay` only in general schedules. */
export interface ShipTimeTable {
  TripID: string;
  StopTimes: ShipStopTime[];
  ServiceDay?: ShipServiceDay;
}

/** Headway-based service (Frequency / GeneralFrequency). */
export interface ShipFrequency {
  StartTime: ShipTime;
  EndTime: ShipTime;
  MinHeadwayMins: number;
  MaxHeadwayMins: number;
  /** `"0"` 離峰 (off-peak), `"1"` 尖峰 (peak). */
  PeakFlag?: string;
  ServiceDay?: ShipServiceDay;
}

/** Regular timetable of a route in one direction (GeneralSchedule). */
export interface ShipGeneralSchedule {
  RouteID: ShipRouteId;
  RouteName: ShipName;
  OperatorID: string;
  EffectiveDate: ShipDate;
  ExpireDate?: ShipDate;
  Direction: ShipDirection;
  TimeTables?: ShipTimeTable[];
  Frequencies?: ShipFrequency[];
}

/** Regular timetables — `GET /v3/Ship/GeneralSchedule[/{RouteID}]` and the `Domestic/City` form. */
export interface ShipGeneralSchedules extends ShipStaticWrapperHeader {
  GeneralSchedules: ShipGeneralSchedule[];
}

/** Timetable of a route for one day and direction (DailySchedule). */
export interface ShipDailySchedule {
  RouteID: ShipRouteId;
  RouteName: ShipName;
  OperatorID: string;
  Date: ShipDate;
  Direction?: ShipDirection;
  TimeTables?: ShipTimeTable[];
  Frequencies?: ShipFrequency[];
}

/** Daily timetables — `GET /v3/Ship/DailySchedule[/{RouteID}]` and the `Domestic/City` form. */
export interface ShipDailySchedules extends ShipStaticWrapperHeader {
  DailySchedules: ShipDailySchedule[];
}

/**
 * Departure row of a port's live board (ShipLiveBoardsDepartureLiveBoard). Remarks:
 * `準時` (on time), `離港` / `已離港` (departed), `取消` (cancelled), `安檢中` (security check),
 * with English in `DepartureRemarkEn`. Some ports publish stale scheduled times (a 2014 date
 * on the Green Island board): trust `ShipDate` and the time of day.
 */
export interface ShipDepartureLiveBoard {
  RouteID?: ShipRouteId;
  VesselID?: string;
  VesselName?: ShipName;
  ArrivalPortID?: ShipPortId;
  ArrivalPortName?: ShipLiveBoardName;
  ScheduledDepartureTime?: DateTimeString;
  ActualDepartureTime?: DateTimeString;
  EstimateDepartureTime?: DateTimeString;
  DepartureRemark?: string;
  DepartureRemarkEn?: string;
  /** `""` unless cancelled. */
  CancelReason?: string;
  ChangeNotice?: string;
}

/** Arrival row of a port's live board (ShipLiveBoardsArrivalLiveBoard). */
export interface ShipArrivalLiveBoard {
  RouteID?: ShipRouteId;
  VesselID?: string;
  VesselName?: ShipName;
  DeparturePortID?: ShipPortId;
  DeparturePortName?: ShipLiveBoardName;
  ScheduledArrivalTime?: DateTimeString;
  ActualArrivalTime?: DateTimeString;
  EstimateArrivalTime?: DateTimeString;
  ArrivalRemark?: string;
  ArrivalRemarkEn?: string;
  CancelReason?: string;
  ChangeNotice?: string;
}

/** A port's live departure and arrival boards for one day (ShipLiveBoards). */
export interface ShipLiveBoard {
  /** Midnight of the service day, e.g. `2026-10-21T00:00:00+08:00`. */
  ShipDate?: DateTimeString;
  PortID?: ShipPortId;
  PortName?: ShipLiveBoardName;
  DepartureLiveBoards?: ShipDepartureLiveBoard[];
  ArrivalLiveBoards?: ShipArrivalLiveBoard[];
  UpdateTime?: DateTimeString;
}

/**
 * Live boards — `GET /v3/Ship/ShipLiveBoard` and `/v3/Ship/ShipLiveBoard/Domestic/City/{City}`.
 * The array really is named `ShipLiveBoardses`.
 */
export interface ShipLiveBoards extends ShipLiveWrapperHeader {
  ShipLiveBoardses: ShipLiveBoard[];
}

/** AIS position of a vessel (LivePosition). */
export interface ShipLivePosition {
  VesselID: string;
  MMSI: string;
  /** `Zh_tw` can be `""`. */
  VesselName?: ShipName;
  VesselPosition: PointType;
  /**
   * AIS navigational status: 0 = under way using engine, 1 = at anchor, 2 = not under command,
   * 3 = restricted manoeuvrability, 4 = constrained by draught, 5 = moored, 6 = aground,
   * 7 = fishing, 8 = under way sailing, 15 = undefined.
   */
  NAVSTAT: number;
  /** Speed over ground in knots. */
  SOG?: number;
  /** Course over ground in degrees from true north. */
  COG?: number;
  /** AIS ship type code, e.g. 60 = passenger. */
  VesselType?: number;
  GPSTime: DateTimeString;
}

/** Live positions — `GET /v3/Ship/LivePosition`. */
export interface ShipLivePositions extends ShipLiveWrapperHeader {
  LivePositions: ShipLivePosition[];
}

/** Seats per cabin class (CabinSeat). */
export interface ShipCabinSeat {
  CabinClass?: string;
  TotalSeats?: number;
  BookedSeats?: number;
  ReservedSeats?: number;
  SeatStatus?: ShipSeatStatus;
}

/** Seats on one sailing (Availability). */
export interface ShipAvailability {
  VesselID?: string;
  VesselName?: ShipName;
  ArrivalPortID?: ShipPortId;
  ArrivalPortName?: ShipName;
  /** Local time without offset, e.g. `2026-10-21T09:50:00`. */
  DepartureTime?: string;
  TotalSeats?: number;
  BookedSeats?: number;
  ReservedSeats?: number;
  SeatStatus?: ShipSeatStatus;
  ShipStatus?: ShipSailingStatus;
  CabinSeats?: ShipCabinSeat[];
  UpdateTime?: DateTimeString;
}

/** Seat availability at a port (SeatAvailability). Live data covers only the 金門–石井 sailings. */
export interface ShipSeatAvailability {
  RouteID?: ShipRouteId;
  RouteName?: ShipName;
  PortID?: ShipPortId;
  PortName?: ShipName;
  Availabilities?: ShipAvailability[];
  Remark?: string;
}

/** Seat availability — `GET /v3/Ship/SeatAvailability`. */
export interface ShipSeatAvailabilities extends ShipLiveWrapperHeader {
  SeatAvailabilities: ShipSeatAvailability[];
}

/** Operator affected by an alert (AlertOperator). */
export interface ShipAlertOperator {
  OperatorID: string;
  OperatorName?: ShipName;
}

/** Port affected by an alert (AlertPort). */
export interface ShipAlertPort {
  PortID: ShipPortId;
  PortName?: ShipName;
}

/** Route affected by an alert (AlertRoute). */
export interface ShipAlertRoute {
  RouteID: ShipRouteId;
  RouteName?: ShipName;
}

/** What an alert affects (Scope). */
export interface ShipAlertScope {
  Operators?: ShipAlertOperator[];
  Ports?: ShipAlertPort[];
  Routes?: ShipAlertRoute[];
}

/** Service alert (Alert). */
export interface ShipAlert {
  AlertID: string;
  Title: string;
  Description: string;
  Department: string;
  Status: ShipAlertStatus;
  Level?: ShipAlertLevel;
  /** e.g. `天災`. */
  Cause?: string;
  Effect?: ShipAlertEffect;
  Scope?: ShipAlertScope;
  AlertURL?: string;
  StartTime: DateTimeString;
  EndTime: DateTimeString;
  PublishTime: DateTimeString;
  UpdateTime: DateTimeString;
}

/** Alerts — `GET /v3/Ship/Alert` and `/v3/Ship/Alert/Domestic/City/{City}`. */
export interface ShipAlerts extends ShipLiveWrapperHeader {
  Alerts: ShipAlert[];
}

/** News item (News). */
export interface ShipNews {
  NewsID: string;
  Language: string;
  Department: string;
  OperatorID?: string;
  Title: string;
  NewsCategory: ShipNewsCategory;
  Description: string;
  ContactName: string;
  Telephone: string;
  NewsURL?: string;
  AttachmentURL?: string;
  StartTime: DateTimeString;
  EndTime: DateTimeString;
  PublishTime: DateTimeString;
  UpdateTime: DateTimeString;
}

/** News — `GET /v3/Ship/News` and `/v3/Ship/News/Domestic/City/{City}`. Empty in live data. */
export interface ShipNewsList extends ShipLiveWrapperHeader {
  Newses: ShipNews[];
}

/** Authority (Authority). */
export interface ShipAuthority {
  /** e.g. `MPB`, `PEN`, `KHH`. */
  AuthorityCode: string;
  AuthorityName: ShipName;
  AuthorityOID: string;
  AuthorityID: string;
  AuthorityPhone: string;
  AuthorityEmail: string;
  AuthorityAddress: string;
  AuthorityUrl?: string;
  LogoURL?: string;
  UpdateTime: DateTimeString;
}

/** Authorities — `GET /v3/Ship/Authority`. */
export interface ShipAuthorities extends ShipStaticWrapperHeader {
  Authorities: ShipAuthority[];
}
