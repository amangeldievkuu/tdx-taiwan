// Metro types, transcribed from the TDX 公共運輸-軌道 v2 OpenAPI spec
// (PTX.Service.DTO.Rail.Specification.V2.Metro.*). Where live data contradicts the spec,
// the type follows the data and says so.
import type { DateTimeString, NameType, OpenString, PointType } from './common.js';

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
export interface MetroAlerts {
  /** TDX update time. */
  UpdateTime: DateTimeString;
  /** TDX update interval in seconds. */
  UpdateInterval: number;
  SrcUpdateTime: DateTimeString;
  /** Source update interval in seconds; `-1` means irregular. */
  SrcUpdateInterval: number;
  AuthorityCode: string;
  Alerts: MetroAlert[];
  Count?: number | null;
}
