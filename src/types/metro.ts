// Metro types, transcribed from the TDX 公共運輸-軌道 v2 OpenAPI spec
// (PTX.Service.DTO.Rail.Specification.V2.Metro.*). Where live data contradicts the spec,
// the type follows the data and says so.
import type {
  DateTimeString,
  NameType,
  OpenString,
  PointType,
  WrapperHeader,
  ZhEnName,
} from './common.js';

/**
 * `RailSystem` path values accepted by most Metro endpoints: TRTC 臺北捷運, KRTC 高雄捷運,
 * TYMC 桃園捷運, TMRT 臺中捷運, KLRT 高雄輕軌, NTDLRT 淡海輕軌, TRTCMG 貓空纜車,
 * NTMC 新北捷運, NTALRT 安坑輕軌.
 */
export type MetroSystem = OpenString<
  'TRTC' | 'KRTC' | 'TYMC' | 'TMRT' | 'KLRT' | 'NTDLRT' | 'TRTCMG' | 'NTMC' | 'NTALRT'
>;

/** `RailSystem` values accepted by the LiveBoard endpoint (others get HTTP 400). */
export type MetroLiveBoardSystem = OpenString<'TRTC' | 'KRTC' | 'TYMC' | 'KLRT'>;

/** `RailSystem` values accepted by the FirstLastTimetable endpoint. */
export type MetroTimetableSystem = OpenString<
  'TRTC' | 'KRTC' | 'TYMC' | 'KLRT' | 'TMRT' | 'NTMC' | 'TRTCMG'
>;

/** 車種: 0 = 不分車種 (any), 1 = 普通車 (local), 2 = 直達車 (express). */
export type MetroTrainType = 0 | 1 | 2;

/**
 * 車次營運服務狀態: 0 = 正常 (normal), 1 = 尚未發車 (not yet departed),
 * 2 = 交管不停靠 (not stopping), 3 = 末班車已過 (last train passed), 4 = 今日未營運 (no service today).
 */
export type MetroServiceStatus = 0 | 1 | 2 | 3 | 4;

/**
 * 票種類型: 1 = 一般票 (single journey), 2 = 來回票 (return), 3 = 電子票證 (e-ticket),
 * 4 = 回數票 (multi-ride), 5 = 定期票30天期 (30-day pass), 6 = 定期票60天期 (60-day pass).
 */
export type MetroTicketType = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * 費率等級: 1 = 成人 (adult), 2 = 學生 (student), 3 = 孩童 (child), 4 = 敬老 (senior),
 * 5 = 愛心 (disabled), 6 = 愛心孩童 (disabled child), 7 = 愛心優待/愛心陪伴 (companion),
 * 8 = 團體 (group).
 */
export type MetroFareClass = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Station (Metro.Station) — `GET /v2/Rail/Metro/Station/{RailSystem}`. */
export interface MetroStation {
  /** Unique station ID: {RailSystem}-{StationID}, e.g. `TRTC-BL12`. */
  StationUID: string;
  /** Station ID, e.g. `BL12`. */
  StationID: string;
  StationName: NameType;
  /** Station address. Required by the spec, but missing for some NTDLRT and NTALRT stations. */
  StationAddress?: string;
  StationPosition?: PointType | null;
  /** Whether bikes are allowed in on holidays. */
  BikeAllowOnHoliday: boolean;
  LocationCity?: string | null;
  LocationCityCode?: string | null;
  LocationTown?: string | null;
  LocationTownCode?: string | null;
  /** Source platform update time. */
  SrcUpdateTime: DateTimeString;
  /** TDX update time. */
  UpdateTime: DateTimeString;
  VersionID: number;
}

/** Line (Metro.Line) — `GET /v2/Rail/Metro/Line/{RailSystem}`. */
export interface MetroLine {
  LineNo?: string | null;
  /** Line ID, e.g. `BL`. */
  LineID: string;
  LineName: NameType;
  /** Line section name. A `NameType` in the spec, but most systems return `{}`. */
  LineSectionName: Partial<NameType>;
  /** Line color, e.g. `#0a59ae`. Required by the spec, but missing for KRTC, KLRT and TRTCMG. */
  LineColor?: string;
  /** Whether this is a branch line. */
  IsBranch: boolean;
  SrcUpdateTime: DateTimeString;
  UpdateTime: DateTimeString;
  VersionID: number;
}

/** A station on a line (Metro.SubClass.Station). */
export interface MetroLineStation {
  /** Position along the line, starting at 1. */
  Sequence: number;
  StationID: string;
  StationName: NameType;
  /** Distance from the first station, in kilometres. */
  CumulativeDistance?: number | null;
}

/** Ordered stations of a line (Metro.StationOfLine) — `GET /v2/Rail/Metro/StationOfLine/{RailSystem}`. */
export interface MetroStationOfLine {
  LineNo?: string | null;
  LineID: string;
  Stations: MetroLineStation[];
  SrcUpdateTime: DateTimeString;
  UpdateTime: DateTimeString;
  VersionID: number;
}

/**
 * Next-train board for each station and direction (Metro.LiveBoard) —
 * `GET /v2/Rail/Metro/LiveBoard/{RailSystem}`. TRTC only lists trains arriving now.
 */
export interface MetroLiveBoard {
  LineNO?: string | null;
  LineID: string;
  LineName: NameType;
  StationID: string;
  StationName: NameType;
  /** Direction description, e.g. `往南港展覽館`. */
  TripHeadSign: string;
  /** Destination station ID. TDX's misspelled original field; same value as `DestinationStationID`. */
  DestinationStaionID: string;
  DestinationStationID: string;
  DestinationStationName: NameType;
  ServiceStatus: MetroServiceStatus;
  /** Estimated **minutes** until the next train (bus ETAs are in seconds). */
  EstimateTime?: number | null;
  SrcUpdateTime: DateTimeString;
  UpdateTime: DateTimeString;
}

/** Days a timetable applies to (Metro.SubClass.ServiceDay). */
export interface MetroServiceDay {
  ServiceTag?: string | null;
  Monday: boolean;
  Tuesday: boolean;
  Wednesday: boolean;
  Thursday: boolean;
  Friday: boolean;
  Saturday: boolean;
  Sunday: boolean;
  NationalHolidays: boolean;
}

/**
 * First and last train per station and direction (Metro.FirstLastTimetable) —
 * `GET /v2/Rail/Metro/FirstLastTimetable/{RailSystem}`.
 */
export interface MetroFirstLastTimetable {
  LineNo?: string | null;
  LineID: string;
  StationID: string;
  StationName: NameType;
  TripHeadSign?: string | null;
  /** Destination station ID (TDX's misspelling; there is no `DestinationStationID` here). */
  DestinationStaionID: string;
  DestinationStationName: NameType;
  TrainType?: MetroTrainType | null;
  /** First train time (HH:mm). */
  FirstTrainTime: string;
  /** Last train time (HH:mm); may be past midnight, e.g. `00:49`. */
  LastTrainTime: string;
  ServiceDay: MetroServiceDay;
  SrcUpdateTime: DateTimeString;
  UpdateTime: DateTimeString;
  VersionID: number;
}

/** One price (Metro.SubClass.Fare). */
export interface MetroFare {
  TicketType: MetroTicketType;
  FareClass: MetroFareClass;
  /** 販售方式: `'1'` counter, `'2'` machine, `'3'` online, `'99'` other. */
  SaleType?: string | null;
  /** Residents-only price: `TPE` 臺北市, `NWT` 新北市, `OTHERS`. */
  CitizenCode?: OpenString<'TPE' | 'NWT' | 'OTHERS'> | null;
  /** Price in NT$. */
  Price: number;
}

/** Fares between two stations (Metro.ODFare) — `GET /v2/Rail/Metro/ODFare/{RailSystem}`. */
export interface MetroODFare {
  OriginStationID: string;
  OriginStationName: NameType;
  DestinationStationID: string;
  DestinationStationName: NameType;
  TrainType?: MetroTrainType | null;
  /** Prices by ticket type and fare class. TDX sometimes repeats identical entries. */
  Fares: MetroFare[];
  /** Travel time in minutes. */
  TravelTime?: number | null;
  /** Travel distance in kilometres. */
  TravelDistance?: number | null;
  SrcUpdateTime: DateTimeString;
  UpdateTime: DateTimeString;
  VersionID: number;
}

/** `RailSystem` values accepted by the Alert endpoint (others, such as NTDLRT, get HTTP 400). */
export type MetroAlertSystem = OpenString<'TRTC' | 'KRTC' | 'TYMC' | 'KLRT' | 'TRTCMG' | 'TMRT'>;

/** 營運狀況: 0 = 全線營運停止 (line stopped), 1 = 全線營運正常 (normal), 2 = 有異常狀況 (disrupted). */
export type MetroAlertStatus = 0 | 1 | 2;

/** Affected network (MRTAlertList.AlertScopeNetwork). */
export interface MetroAlertScopeNetwork {
  NetworkID?: string | null;
}

/** Affected station (MRTAlertList.AlertScopeStation). */
export interface MetroAlertScopeStation {
  StationID?: string | null;
  StationName?: string | null;
}

/** Affected line (MRTAlertList.AlertScopeLine). */
export interface MetroAlertScopeLine {
  LineID?: string | null;
  LineName?: string | null;
}

/** Affected service route (MRTAlertList.AlertScopeRoute). */
export interface MetroAlertScopeRoute {
  RouteID?: string | null;
  RouteName?: string | null;
}

/** Affected train (MRTAlertList.AlertScopeTrain). */
export interface MetroAlertScopeTrain {
  TrainNo?: string | null;
}

/** Affected section of a line (MRTAlertList.AlertScopeLineSection). */
export interface MetroAlertScopeLineSection {
  LineID?: string | null;
  StartingStationID?: string | null;
  StartingStationName?: string | null;
  EndingStationID?: string | null;
  EndingStationName?: string | null;
  Description?: string | null;
}

/** What an alert affects (MRTAlertList.AlertScope). Empty arrays on a normal day. */
export interface MetroAlertScope {
  Network?: MetroAlertScopeNetwork | null;
  Stations: MetroAlertScopeStation[];
  Lines: MetroAlertScopeLine[];
  Routes: MetroAlertScopeRoute[];
  Trains: MetroAlertScopeTrain[];
  LineSections: MetroAlertScopeLineSection[];
}

/** Service alert (Metro.Alert). On a normal day there is one "正常營運" alert with `Status: 1`. */
export interface MetroAlert {
  AlertID: string;
  Title: string;
  Description: string;
  Status: MetroAlertStatus;
  Scope: MetroAlertScope;
  /** 影響方向: 0 = 去程 (outbound), 1 = 返程 (inbound). */
  Direction?: 0 | 1 | null;
  /** 影響等級: 1 = 重度 (severe), 2 = 中度 (moderate), 3 = 輕度 (minor). */
  Level?: 1 | 2 | 3 | null;
  Effect?: string | null;
  Reason?: string | null;
  AlertURL?: string | null;
  StartTime?: DateTimeString | null;
  EndTime?: DateTimeString | null;
  PublishTime?: DateTimeString | null;
  UpdateTime: DateTimeString;
}

/** Alerts of a rail system (MRTRealTimeWrapper[Metro.Alert]) — `GET /v2/Rail/Metro/Alert/{RailSystem}`. */
export interface MetroAlerts extends WrapperHeader {
  Alerts: MetroAlert[];
}

/** `RailSystem` values with a news feed. */
export type MetroNewsSystem = OpenString<'TRTC' | 'KRTC' | 'TYMC' | 'KLRT' | 'TMRT'>;

/** `RailSystem` values with live train positions: only `KLRT` (others get HTTP 400). */
export type MetroLivePositionSystem = OpenString<'KLRT'>;

/** 是否有電扶梯: 0 = 沒有 (none), 1 = 雙向 (both ways), 2 = 出站 (exit only), 3 = 入站 (entry only). */
export type MetroEscalator = 0 | 1 | 2 | 3;

/** 軌道路線類別: 33 = 都市捷運 (urban metro), 34 = 機場捷運 (airport line). */
export type MetroRailRouteType = 33 | 34;

/** 營運路線方向: 0 = 去程 (outbound), 1 = 返程 (return). */
export type MetroDirection = 0 | 1;

/** Fields every static v2 item carries. */
export interface MetroVersioned {
  SrcUpdateTime: DateTimeString;
  UpdateTime: DateTimeString;
  VersionID: number;
}

/** Map image of an exit or facility (ExitMapURL / FacilityMapURL). */
export interface MetroMapURL {
  MapName?: NameType | null;
  MapURL?: string | null;
  FloorLevel?: string | null;
}

/** Station exit (Metro.StationExit) — `GET /v2/Rail/Metro/StationExit/{RailSystem}`. */
export interface MetroStationExit extends MetroVersioned {
  StationID: string;
  StationName: NameType;
  ExitID: string;
  ExitName: NameType;
  ExitPosition: PointType;
  LocationDescription: string;
  Stair: boolean;
  Escalator: MetroEscalator;
  Elevator: boolean;
  ExitMapURLs?: MetroMapURL[] | null;
}

/** Location of a facility in a station (Elevator, InformationSpot, DrinkingFountain, Toilet). */
export interface MetroFacilitySpot {
  Description: string;
  FloorLevel: string;
}

/** Station facilities (Metro.StationFacility) — `GET /v2/Rail/Metro/StationFacility/{RailSystem}`. */
export interface MetroStationFacility extends MetroVersioned {
  StationID: string;
  StationName: NameType;
  FacilityMapURLs?: MetroMapURL[] | null;
  Elevators?: MetroFacilitySpot[] | null;
  InformationSpots?: MetroFacilitySpot[] | null;
  DrinkingFountains?: MetroFacilitySpot[] | null;
  Toilets?: MetroFacilitySpot[] | null;
}

/** Transfer between two lines at a station (Metro.LineTransfer) — `GET /v2/Rail/Metro/LineTransfer/{RailSystem}`. */
export interface MetroLineTransfer extends MetroVersioned {
  FromLineNo?: string | null;
  FromLineID: string;
  FromLineName: NameType;
  FromStationID: string;
  FromStationName: NameType;
  ToLineNo: string;
  ToLineID: string;
  ToLineName: NameType;
  ToStationID: string;
  ToStationName: NameType;
  /** 0 = 站外 (outside the paid area), 1 = 站內 (inside). */
  IsOnSiteTransfer?: 0 | 1 | null;
  /** Minutes. */
  TransferTime: number;
  TransferDescription: string;
}

/** Fields shared by the transfer kinds of a station exit. */
export interface MetroTransferBase {
  /** Transport mode code. */
  Mode: string;
  /** Minutes. */
  MinTransferTime?: number | null;
  FloorLevel?: string | null;
  Description?: string | null;
  /** 0 = 站外, 1 = 站內. */
  IsOnSiteTransfer?: 0 | 1 | null;
}

/** Transfer to another rail system (RailTransfer). */
export interface MetroRailTransfer extends MetroTransferBase {
  OperatorCode: string;
  OperatorName: ZhEnName;
  StationID: string;
  StationName: ZhEnName;
}

/** Transfer to a bus route (BusTransfer). */
export interface MetroBusTransfer extends MetroTransferBase {
  OperatorCode: string;
  OperatorName: ZhEnName;
  RouteID: string;
  RouteName: ZhEnName;
  StopID: string;
  StopName: ZhEnName;
  Destination: string;
}

/** Transfer to an airport (AirportTransfer). */
export interface MetroAirportTransfer extends MetroTransferBase {
  OperatorCode: string;
  OperatorName: ZhEnName;
  AirportID: string;
  AirportName: ZhEnName;
}

/** Transfer to a public bike station (BikeTransfer). */
export interface MetroBikeTransfer extends MetroTransferBase {
  OperatorCode: string;
  OperatorName: ZhEnName;
  StationID: string;
  StationName: ZhEnName;
}

/** Transfer to a car park (ParkingTransfer). */
export interface MetroParkingTransfer extends MetroTransferBase {
  CarParkID: string;
  CarParkName: ZhEnName;
}

/** Transfer to a taxi stand (TaxiTransfer). */
export interface MetroTaxiTransfer extends MetroTransferBase {
  TaxiStopID: string;
  TaxiStopName: ZhEnName;
}

/** Transfers available from one exit (Transfer). */
export interface MetroExitTransfer {
  ExitID?: string | null;
  ExitName?: ZhEnName | null;
  RailTransfers?: MetroRailTransfer[] | null;
  BusTransfers?: MetroBusTransfer[] | null;
  AirportTransfers?: MetroAirportTransfer[] | null;
  BikeTransfers?: MetroBikeTransfer[] | null;
  ParkingTransfers?: MetroParkingTransfer[] | null;
  TaxiTransfers?: MetroTaxiTransfer[] | null;
}

/** Map link in a station transfer record (InteriorMapURL / ExteriorMapURL). */
export interface MetroTransferMapURL {
  MapName: ZhEnName;
  MapURL: string;
  FloorLevel?: string | null;
}

/** Transfers to other modes at a station (StationTransfer). */
export interface MetroStationTransfer {
  StationID: string;
  StationName: ZhEnName;
  TransferDescription?: string | null;
  InteriorMapURLs?: MetroTransferMapURL[] | null;
  ExteriorMapURLs?: MetroTransferMapURL[] | null;
  Transfers?: MetroExitTransfer[] | null;
}

/**
 * Station transfers — `GET /v2/Rail/Metro/StationTransfer/{RailSystem}` (TRTC, NTMC, TYMC).
 * Live data sends `UpdateInterval: 0`.
 */
export interface MetroStationTransfers extends WrapperHeader {
  StationTransfers: MetroStationTransfer[];
}

/** Service route of a line (Metro.Route) — `GET /v2/Rail/Metro/Route/{RailSystem}`. */
export interface MetroRoute extends MetroVersioned {
  /** e.g. `BL-1`. */
  RouteID: string;
  OperatorCode: string;
  RouteName: NameType;
  RailRouteType: MetroRailRouteType;
  LineNo?: string | null;
  LineID: string;
  Direction: MetroDirection;
  StartStationID: string;
  StartStationName: NameType;
  EndStationID: string;
  EndStationName: NameType;
  /** Minutes end to end. */
  TravelTime: number;
  /** Kilometres. */
  RouteLength: number;
}

/** Station of a route (StationOfRoute.Station). */
export interface MetroRouteStation {
  Sequence: number;
  StationID: string;
  StationName: NameType;
  /** Kilometres from the start of the route. */
  CumulativeDistance?: number | null;
}

/** Ordered stations of a route (Metro.StationOfRoute) — `GET /v2/Rail/Metro/StationOfRoute/{RailSystem}`. */
export interface MetroStationOfRoute extends MetroVersioned {
  LineNo?: string | null;
  LineID: string;
  RouteID: string;
  RouteName: NameType;
  Direction: MetroDirection;
  Stations: MetroRouteStation[];
}

/** Operating hours of a route (OperationTime). */
export interface MetroOperationTime {
  StartTime: string;
  EndTime: string;
}

/** Headway for a time band (Headway). */
export interface MetroHeadway {
  /** `"0"` off-peak, `"1"` peak. */
  PeakFlag: string;
  StartTime: string;
  EndTime: string;
  MinHeadwayMins: number;
  MaxHeadwayMins: number;
}

/** Headways of a route on a kind of day (Metro.Frequency) — `GET /v2/Rail/Metro/Frequency/{RailSystem}`. */
export interface MetroFrequency extends MetroVersioned {
  LineNo?: string | null;
  LineID: string;
  RouteID: string;
  TrainType?: MetroTrainType | null;
  ServiceDay: MetroServiceDay;
  OperationTime: MetroOperationTime;
  Headways: MetroHeadway[];
}

/** One departure in a station timetable (StationTimeTable.Timetable). */
export interface MetroTimetableEntry {
  Sequence: number;
  /** Usually absent: metros do not number trains. */
  TrainNo?: string | null;
  /** `hh:mm`. */
  ArrivalTime?: string | null;
  DepartureTime: string;
  TrainType?: MetroTrainType | null;
  StoppingPatternID?: string | null;
}

/** Special date range of a station timetable (SpecialDay). `SaterDate` is TDX's spelling. */
export interface MetroSpecialDay {
  SaterDate: string;
  EndDate: string;
  Description: string;
}

/**
 * Departures from a station towards a destination on a kind of day (Metro.StationTimeTable) —
 * `GET /v2/Rail/Metro/StationTimeTable/{RailSystem}`. TRTC does not publish the 文湖線;
 * use `frequency` for it. `DestinationStaionID` is TDX's spelling.
 */
export interface MetroStationTimetable extends MetroVersioned {
  RouteID?: string | null;
  LineID: string;
  StationID: string;
  StationName: NameType;
  Direction?: MetroDirection | null;
  DestinationStaionID: string;
  DestinationStationName: NameType;
  Timetables: MetroTimetableEntry[];
  ServiceDay: MetroServiceDay;
  SpecialDays?: MetroSpecialDay[] | null;
}

/**
 * News item (MRTNewsList.News). Taipei sends the sentinel `0001-01-01T00:00:00+08:06` for
 * every time field and omits `Language`.
 */
export interface MetroNews {
  NewsID: string;
  /** 1 Zh_tw, 2 En_us, 3 Zh_cn, 4 Ja, 5 Ko, 99 other. */
  Language?: number | null;
  Department?: string | null;
  Title: string;
  /** 1 最新消息, 2 新聞稿, 3 營運資訊, 4 轉乘資訊, 5 活動訊息, 6 系統公告, 7-10 platform notices, 99 其他. */
  NewsCategory: number;
  /** HTML. */
  Description: string;
  NewsURL?: string | null;
  AttachmentURL?: string | null;
  StartTime?: DateTimeString | null;
  EndTime?: DateTimeString | null;
  PublishTime: DateTimeString;
  UpdateTime: DateTimeString;
}

/** News — `GET /v2/Rail/Metro/News/{RailSystem}`. */
export interface MetroNewsList extends WrapperHeader {
  Newses: MetroNews[];
}

/** Live train position (MRTLivePositionList.LivePosition). */
export interface MetroLivePosition {
  TripID: string;
  OperatorCode: string;
  LineID: string;
  LineName: NameType;
  /** 0 去程, 1 返程, 2 迴圈, 255 unknown. */
  Direction: number;
  /** 0 unknown, 1 scheduled, 2 unscheduled. */
  MessageType?: number | null;
  TrainPosition: PointType;
  /** km/h. */
  Speed: number;
  /** Degrees. */
  Azimuth: number;
  /** 0 normal, 1 starting, 2 ending. */
  DutyStatus: number;
  /** 0 normal, 1 accident, 2 fault, 3 congestion, 4 emergency, 98 off route, 99 not in service, 100 full, 255 unknown. */
  TrainStatus: number;
  GPSTime: DateTimeString;
  GPSTransTime: DateTimeString;
  UpdateTime: DateTimeString;
}

/** Live train positions — `GET /v2/Rail/Metro/LivePosition/{RailSystem}` (KLRT only). */
export interface MetroLivePositions extends WrapperHeader {
  LivePositions: MetroLivePosition[];
}

/** `RailSystem` values with a network record (adds the Maokong gondola). */
export type MetroNetworkSystem = OpenString<MetroSystem | 'TRTCMG'>;

/** `RailSystem` values with shapes (adds the 淡海 and 安坑 light rails and the gondola). */
export type MetroShapeSystem = OpenString<MetroSystem | 'NTDLRT' | 'NTALRT' | 'TRTCMG'>;

/** `RailSystem` values with platforms: only `KLRT`. */
export type MetroPlatformSystem = OpenString<'KLRT'>;

/** `RailSystem` values with stopping patterns: only `TYMC`. */
export type MetroStoppingPatternSystem = OpenString<'TYMC'>;

/** Combined systems for the shared-station list: `TRTC_NTMC` (Taipei + New Taipei) or `KRTC`. */
export type MetroTransferStationSystem = OpenString<'TRTC_NTMC' | 'KRTC'>;

/** Line of a network (Network.Line). */
export interface MetroNetworkLine {
  LineNo?: string | null;
  LineID: string;
}

/** Network of an operator (Metro.Network) — `GET /v2/Rail/Metro/Network/{RailSystem}`. */
export interface MetroNetwork extends MetroVersioned {
  /** e.g. `TRTC-Network`. */
  NetworkID: string;
  NetworkName: NameType;
  OperatorCode: string;
  OperatorName: NameType;
  NetworkMapURL: string;
  Lines: MetroNetworkLine[];
}

/** Run time between two adjacent stations (S2STravelTime.TravelTime). */
export interface MetroTravelTime {
  Sequence: number;
  FromStationID: string;
  FromStationName: NameType;
  ToStationID: string;
  ToStationName: NameType;
  /** Seconds. */
  RunTime: number;
  /** Dwell time at the origin station, seconds. */
  StopTime?: number | null;
}

/**
 * Station-to-station run times of a route (Metro.S2STravelTime) —
 * `GET /v2/Rail/Metro/S2STravelTime/{RailSystem}`.
 */
export interface MetroS2STravelTime extends MetroVersioned {
  LineNo?: string | null;
  LineID: string;
  RouteID: string;
  TrainType?: MetroTrainType | null;
  TravelTimes: MetroTravelTime[];
}

/**
 * Line geometry (Metro.MetroShape) — `GET /v2/Rail/Metro/Shape/{RailSystem}`. `Geometry` is
 * WKT (`MULTILINESTRING`); live data sends `EncodedPolyline: ""`.
 */
export interface MetroShape {
  Geometry: string;
  EncodedPolyline: string;
  LineNo?: string | null;
  LineID: string;
  LineName: NameType;
  UpdateTime: DateTimeString;
}

/** Platform of a station (StationPlatform). */
export interface MetroStationPlatform {
  StationID: string;
  /** e.g. `C1-1`. */
  PlatformID: string;
  PlatformName: NameType;
  Direction?: MetroDirection | null;
  PlatformPosition?: PointType | null;
}

/**
 * Platforms — `GET /v2/Rail/Metro/StationPlatform/{RailSystem}` (KLRT only). Live data omits
 * `AuthorityCode` and sends `UpdateInterval: 0`.
 */
export interface MetroStationPlatforms extends Omit<WrapperHeader, 'AuthorityCode'> {
  AuthorityCode?: string | null;
  StationPlatforms: MetroStationPlatform[];
}

/** Station of a stopping pattern (StoppingPattern.Station). */
export interface MetroStoppingPatternStation {
  Sequence: number;
  StationID: string;
  StationName: NameType;
  /** Kilometres from the start of the route (absent in live data). */
  CumulativeDistance?: number | null;
  /** Minutes from the start of the route (absent in live data). */
  TravelTime?: number | null;
}

/** Stopping pattern of a route, e.g. 普通車 / 直達車 (StoppingPattern). */
export interface MetroStoppingPattern {
  /** e.g. `SP1`. */
  StoppingPatternID: string;
  StoppingPatternName: NameType;
  RouteID: string;
  Stations: MetroStoppingPatternStation[];
}

/** Stopping patterns — `GET /v2/Rail/Metro/StoppingPattern/{RailSystem}` (TYMC only). */
export interface MetroStoppingPatterns extends WrapperHeader {
  AuthorityCode: string;
  StoppingPatterns: MetroStoppingPattern[];
}

/** One of the stations sharing a transfer station (TransferStation). */
export interface MetroSharedStation {
  StationID?: string | null;
  /** Plain string, not a `NameType`. */
  StationName?: string | null;
}

/**
 * Stations shared by two lines or systems (MetroTransferStation) —
 * `GET /v2/Rail/Metro/TransferStations/{RailSystem}`.
 */
export interface MetroTransferStation {
  /** e.g. `TRTC_NTMC`. */
  SystemID?: string | null;
  /** Composite, e.g. `BL07_Y16`. */
  TransferStationID?: string | null;
  Stations?: MetroSharedStation[] | null;
}
