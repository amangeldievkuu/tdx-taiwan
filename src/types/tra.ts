// Taiwan Railway (臺鐵) types, transcribed from the TDX 公共運輸-軌道 v3 OpenAPI spec
// (PTX.Service.DTO.Rail.Specification.V3.TRA.*). Every TRA v3 endpoint wraps its items in an
// object. Where live data contradicts the spec, the type follows the data and says so.
import type { DateTimeString, Flag, OpenString, PointType } from './common.js';

/**
 * Multilingual name used by TRA v3 (TRANameType). Unlike `NameType`, every field is optional
 * and the Korean name is `Kr`, not `Ko`.
 */
export interface TraNameType {
  Zh_tw?: string | null;
  En?: string | null;
  Ja?: string | null;
  Kr?: string | null;
}

/**
 * TRA station ID (4 digits). There are about 245 stations, so any string is accepted; common
 * ones: `0900` 基隆, `1000` 臺北, `1020` 板橋, `1080` 桃園, `1210` 新竹, `3300` 臺中,
 * `3360` 彰化, `4220` 臺南, `4400` 高雄, `5000` 屏東, `6000` 臺東, `7000` 花蓮, `7190` 宜蘭.
 */
export type TraStationId = string;

/** 行駛方向: 0 = 順行 (clockwise / southbound on the west coast), 1 = 逆行 (counter-clockwise). */
export type TraDirection = 0 | 1;

/** 山海線類型: 0 = 不經山海線, 1 = 山線 (mountain line), 2 = 海線 (coast line), 3 = 成追線. */
export type TraTripLine = 0 | 1 | 2 | 3;

/** A yes/no flag: 0 = 否 (no), 1 = 是 (yes). */
export type TraFlag = Flag;

/**
 * 車種簡碼: `1` 太魯閣 Taroko, `2` 普悠瑪 Puyuma, `3` 自強 Tze-Chiang, `4` 莒光 Chu-Kuang,
 * `5` 復興 Fu-Hsing, `6` 區間 Local, `7` 普快 Ordinary, `10` 區間快 Fast Local. Live data also
 * uses `11` for 自強(3000), which the spec does not list.
 */
export type TraTrainTypeCode = OpenString<'1' | '2' | '3' | '4' | '5' | '6' | '7' | '10' | '11'>;

/** 車站級別: `0` 特等 … `6` 號誌, `A` 貨運 (freight), `B` 基地 (depot), `X` 非車 (non-passenger). */
export type TraStationClass = OpenString<'0' | '1' | '2' | '3' | '4' | '5' | '6' | 'A' | 'B' | 'X'>;

/** 列車是否停駛: 0 = 正常行駛 (running), 1 = 停駛 (cancelled), 2 = 部份停駛 (partly cancelled). */
export type TraSuspendedFlag = 0 | 1 | 2;

/** 列車服務類型: 1 = 定期 (regular), 2 = 加開 (extra), 3 = 郵輪 (cruise), 4 = 專列 (charter). */
export type TraServiceType = 1 | 2 | 3 | 4;

/** 列車狀態: 0 = 準點 (on time), 1 = 誤點 (delayed), 2 = 取消 (cancelled). */
export type TraRunningStatus = 0 | 1 | 2;

/** 列車目前所在之車站狀態: 0 = 進站中 (arriving), 1 = 在站上 (at the station), 2 = 已離站 (departed). */
export type TraTrainStationStatus = 0 | 1 | 2;

/**
 * 票種類型: 1 = 一般票 (single), 2 = 來回票 (return), 3 = 電子票證 (e-ticket), 4 = 回數票
 * (multi-ride), 5 = 定期票30天期 (30-day pass), 6 = 定期票60天期 (60-day pass), 7 = 早鳥票 (early bird).
 */
export type TraTicketType = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * 費率等級: 1 = 成人 (adult), 2 = 學生 (student), 3 = 孩童 (child), 4 = 敬老 (senior),
 * 5 = 愛心 (disabled), 6 = 愛心孩童 (disabled child), 7 = 愛心優待/愛心陪伴 (companion),
 * 8 = 團體 (group), 9 = 軍警 (military/police).
 */
export type TraFareClass = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** 艙等: 1 = 標準座 (standard), 2 = 商務座 (business), 3 = 自由座 (non-reserved). */
export type TraCabinClass = 1 | 2 | 3;

/** 營運狀況: 0 = 全線營運停止 (line stopped), 1 = 全線營運正常 (normal), 2 = 有異常狀況 (disrupted). */
export type TraAlertStatus = 0 | 1 | 2;

/** Header fields shared by every TRA v3 response wrapper. */
export interface TraWrapperHeader {
  /** TDX update time. */
  UpdateTime: DateTimeString;
  /** TDX update interval in seconds. */
  UpdateInterval: number;
  /** Source update time. */
  SrcUpdateTime: DateTimeString;
  /** Source update interval in seconds; `-1` means irregular. */
  SrcUpdateInterval: number;
  /** Total number of items, when TDX reports it. */
  Count?: number | null;
}

/** Station (TRA.Station). */
export interface TraStation {
  /** Unique station ID, e.g. `TRA-1000`. */
  StationUID: string;
  /** Station ID, e.g. `1000`. */
  StationID: string;
  /** Booking system station code. */
  ReservationCode?: string | null;
  StationName: TraNameType;
  StationPosition: PointType;
  StationAddress?: string | null;
  StationPhone?: string | null;
  StationClass?: TraStationClass | null;
  /** Station page on the TRA website. */
  StationURL?: string | null;
}

/** Stations — `GET /v3/Rail/TRA/Station`. */
export interface TraStations extends TraWrapperHeader {
  AuthorityCode: string;
  Stations: TraStation[];
}

/** A station range (TRA.DailyTrainTimeTable.SectionAmong). */
export interface TraSectionAmong {
  StartStationID: string;
  EndStationID: string;
}

/** Where meal boxes can be ordered (TRA.DailyTrainTimeTable.DiningFlagSection). */
export interface TraDiningFlagSection {
  /** Range the passenger boards in. */
  StartSection: TraSectionAmong;
  /** Range the passenger alights in. */
  EndSection: TraSectionAmong;
}

/** Train information (TRA.DailyTrainTimeTable.TrainInfo). */
export interface TraTrainInfo {
  /** Train number, e.g. `103`. */
  TrainNo: string;
  /** Service route ID (often empty). */
  RouteID: string;
  Direction: TraDirection;
  TrainTypeID?: string | null;
  TrainTypeCode?: TraTrainTypeCode | null;
  TrainTypeName: TraNameType;
  /** Direction description, e.g. `往潮州`. */
  TripHeadSign?: string | null;
  StartingStationID?: string | null;
  StartingStationName: TraNameType;
  EndingStationID?: string | null;
  EndingStationName: TraNameType;
  /** Station after which the train runs past midnight (often empty). */
  OverNightStationID?: string | null;
  TripLine?: TraTripLine | null;
  /** Has a wheelchair-accessible car. */
  WheelChairFlag: TraFlag;
  /** Carries luggage. */
  PackageServiceFlag: TraFlag;
  /** Meal boxes can be ordered. */
  DiningFlag: TraFlag;
  DiningFlagSections?: TraDiningFlagSection[] | null;
  /** Has a breastfeeding room. */
  BreastFeedFlag: TraFlag;
  /** Bikes allowed without a bag. */
  BikeFlag: TraFlag;
  /** Carries cars. */
  CarFlag?: TraFlag | null;
  /** Runs every day. */
  DailyFlag: TraFlag;
  /** Extra (relief) train. */
  ExtraTrainFlag: TraFlag;
  SuspendedFlag: TraSuspendedFlag;
  ServiceType?: TraServiceType | null;
  /** Note, e.g. `每日行駛。`. */
  Note?: string | null;
}

/** A stop of a train (TRA.DailyTrainTimeTable.StopTime). */
export interface TraStopTime {
  /** Stop number along the train's run. */
  StopSequence: number;
  StationID: string;
  StationName: TraNameType;
  /** Arrival time (HH:mm). */
  ArrivalTime?: string | null;
  /** Departure time (HH:mm). */
  DepartureTime?: string | null;
  /** Whether service at this stop is suspended (0 = no, 1 = yes). */
  SuspendedFlag: TraFlag;
}

/** One train in a daily timetable (TRA.DailyTrainTimeTable.TrainTimetable). */
export interface TraTrainTimetable {
  TrainInfo: TraTrainInfo;
  /** Only the origin and destination stops for an OD query. */
  StopTimes: TraStopTime[];
}

/**
 * Trains between two stations on a day —
 * `GET /v3/Rail/TRA/DailyTrainTimetable/OD/{OriginStationID}/to/{DestinationStationID}/{TrainDate}`.
 */
export interface TraTimetable extends TraWrapperHeader {
  /** Authority code. Required by the spec, but missing from live responses. */
  AuthorityCode?: string;
  /** Service date (YYYY-MM-DD). */
  TrainDate: string;
  TrainTimetables?: TraTrainTimetable[] | null;
}

/** One price (TRA.ODFare.Fare). */
export interface TraFare {
  TicketType: TraTicketType;
  FareClass: TraFareClass;
  CabinClass: TraCabinClass;
  /** Price in NT$. */
  Price: number;
}

/** Fares between two stations for one train type (TRA.ODFare.ODFare). */
export interface TraODFare {
  OriginStationID: string;
  OriginStationName: TraNameType;
  DestinationStationID: string;
  DestinationStationName: TraNameType;
  Direction?: TraDirection | null;
  /** Train type code as a number (see {@link TraTrainTypeCode}); `11` = 自強(3000). */
  TrainType: number;
  Fares: TraFare[];
  /** Distance in kilometres. */
  TravelDistance?: number | null;
}

/** Fares between two stations — `GET /v3/Rail/TRA/ODFare/{OriginStationID}/to/{DestinationStationID}`. */
export interface TraODFares extends TraWrapperHeader {
  /** Authority code. Required by the spec, but missing from live responses. */
  AuthorityCode?: string;
  /** First day these fares apply. */
  EffectiveDate?: string | null;
  /** Last day these fares apply. */
  ExpireDate?: string | null;
  SrcVersion?: string | null;
  /** One entry per train type. */
  ODFares: TraODFare[];
}

/** A train about to arrive at or leave a station (TRA.TRAStationLiveBoardList.StationLiveBoard). */
export interface TraStationLiveBoard {
  StationID: string;
  StationName: TraNameType;
  TrainNo: string;
  Direction?: TraDirection | null;
  TrainTypeID?: string | null;
  TrainTypeCode?: TraTrainTypeCode | null;
  TrainTypeName: TraNameType;
  EndingStationID?: string | null;
  EndingStationName: TraNameType;
  TripLine?: TraTripLine | null;
  /** Platform; `''` or `00` until it is assigned. */
  Platform?: string | null;
  /** Scheduled arrival (HH:mm:ss). */
  ScheduleArrivalTime?: string | null;
  /** Scheduled departure (HH:mm:ss). */
  ScheduleDepartureTime?: string | null;
  /** Delay in minutes. */
  DelayTime: number;
  RunningStatus?: TraRunningStatus | null;
  UpdateTime: DateTimeString;
}

/**
 * Trains about to arrive at or leave a station —
 * `GET /v3/Rail/TRA/StationLiveBoard/Station/{StationID}`. Lists only imminent trains; use the
 * timetable for planning.
 */
export interface TraStationLiveBoards extends TraWrapperHeader {
  AuthorityCode: string;
  StationLiveBoards: TraStationLiveBoard[];
}

/** Where a train is now (TRA.TRATrainLiveBoardList.TrainLiveBoard). */
export interface TraTrainLiveBoard {
  TrainNo?: string | null;
  TrainTypeID?: string | null;
  TrainTypeCode?: TraTrainTypeCode | null;
  TrainTypeName: TraNameType;
  /** The station the train is at, arriving at or has just left. */
  StationID?: string | null;
  StationName: TraNameType;
  TrainStationStatus?: TraTrainStationStatus | null;
  /** Delay in minutes. */
  DelayTime: number;
  UpdateTime: DateTimeString;
}

/** Live position of a train — `GET /v3/Rail/TRA/TrainLiveBoard/TrainNo/{TrainNo}`. */
export interface TraTrainLiveBoards extends TraWrapperHeader {
  AuthorityCode: string;
  TrainLiveBoards: TraTrainLiveBoard[];
}

/** Affected network (TRAAlertList.AlertScopeNetwork). */
export interface TraAlertScopeNetwork {
  NetworkID?: string | null;
  NetworkName?: string | null;
}

/** Affected station (TRAAlertList.AlertScopeStation). */
export interface TraAlertScopeStation {
  StationID?: string | null;
  StationName?: string | null;
}

/** Affected line (TRAAlertList.AlertScopeLine). */
export interface TraAlertScopeLine {
  LineID?: string | null;
  LineName?: string | null;
}

/** Affected route (TRAAlertList.AlertScopeRoute). */
export interface TraAlertScopeRoute {
  RouteID?: string | null;
  RouteName?: string | null;
}

/** Affected train (TRAAlertList.AlertScopeTrain). */
export interface TraAlertScopeTrain {
  TrainNo?: string | null;
}

/** Affected section of a line (TRAAlertList.AlertScopeLineSection). */
export interface TraAlertScopeLineSection {
  LineID?: string | null;
  StartingStationID?: string | null;
  StartingStationName?: string | null;
  EndingStationID?: string | null;
  EndingStationName?: string | null;
  Description?: string | null;
}

/** What an alert affects (TRAAlertList.AlertScope). */
export interface TraAlertScope {
  NetworkList?: TraAlertScopeNetwork | null;
  Stations?: TraAlertScopeStation[] | null;
  Lines?: TraAlertScopeLine[] | null;
  Routes?: TraAlertScopeRoute[] | null;
  Trains?: TraAlertScopeTrain[] | null;
  LineSections?: TraAlertScopeLineSection[] | null;
}

/**
 * Service alert (TRAAlertList.Alert). On a normal day there is one "全線營運正常" alert with
 * `Status: 1` and only `Title`, `Status` and `UpdateTime`.
 */
export interface TraAlert {
  /** Alert ID. Required by the spec, but missing from the normal-day alert. */
  AlertID?: string;
  Title: string;
  /** Description. Required by the spec, but missing from the normal-day alert. */
  Description?: string;
  Status: TraAlertStatus;
  Scope?: TraAlertScope | null;
  /** 影響方向: 0 = 南下 (southbound), 1 = 北上 (northbound), 2 = 雙向 (both). */
  Direction?: 0 | 1 | 2 | null;
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

/** Service alerts — `GET /v3/Rail/TRA/Alert`. */
export interface TraAlerts extends TraWrapperHeader {
  AuthorityCode: string;
  Alerts: TraAlert[];
}
