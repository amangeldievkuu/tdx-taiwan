// Taiwan Railway (臺鐵) types, transcribed from the TDX 公共運輸-軌道 v3 OpenAPI spec
// (PTX.Service.DTO.Rail.Specification.V3.TRA.*). Every TRA v3 endpoint wraps its items in an
// object. Where live data contradicts the spec, the type follows the data and says so.
import type { DateTimeString, Flag, OpenString, PointType, ZhEnName } from './common.js';

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

/** Header of the general (regular) timetable wrappers. Live data sends the text fields as `""`. */
export interface TraTimetableWrapperHeader extends TraWrapperHeader {
  AuthorityCode: string;
  /** A full timestamp in live data, e.g. `2026-07-01T00:00:00+08:00`. */
  EffectiveDate: string;
  ExpireDate?: string | null;
  SrcVersion?: string | null;
  TimetableName?: string | null;
  /** TDX's spelling. */
  ValidityDesciption?: string | null;
}

/** Days a regular train runs (GeneralTrainTimetable.ServiceDay): 0 = 否, 1 = 是. */
export interface TraGeneralServiceDay {
  ServiceTag?: string | null;
  Monday: TraFlag;
  Tuesday: TraFlag;
  Wednesday: TraFlag;
  Thursday: TraFlag;
  Friday: TraFlag;
  Saturday: TraFlag;
  Sunday: TraFlag;
  NationalHolidays: TraFlag;
  DayBeforeHoliday: TraFlag;
  DayAfterHoliday: TraFlag;
  TyphoonDay: TraFlag;
}

/** Train information in the regular timetable (GeneralTrainTimetable.TrainInfo). */
export interface TraGeneralTrainInfo {
  TrainNo: string;
  /** Often `""`. */
  RouteID?: string | null;
  Direction: TraDirection;
  TrainTypeID?: string | null;
  TrainTypeCode?: TraTrainTypeCode | null;
  TrainTypeName?: TraNameType | null;
  TripHeadSign?: string | null;
  StartingStationID?: string | null;
  StartingStationName?: TraNameType | null;
  EndingStationID?: string | null;
  EndingStationName?: TraNameType | null;
  OverNightStationID?: string | null;
  TripLine?: TraTripLine | null;
  WheelChairFlag: TraFlag;
  PackageServiceFlag: TraFlag;
  DiningFlag: TraFlag;
  BreastFeedFlag: TraFlag;
  BikeFlag: TraFlag;
  CarFlag: TraFlag;
  DailyFlag: TraFlag;
  ExtraTrainFlag: TraFlag;
  Note?: string | null;
}

/** A stop in the regular timetable (GeneralTrainTimetable.StopTime); times are `HH:mm`. */
export interface TraGeneralStopTime {
  StopSequence: number;
  StationID: string;
  StationName: TraNameType;
  ArrivalTime: string;
  DepartureTime: string;
}

/** One regular train (GeneralTrainTimetable). */
export interface TraGeneralTrainTimetable {
  TrainInfo: TraGeneralTrainInfo;
  StopTimes: TraGeneralStopTime[];
  ServiceDay: TraGeneralServiceDay;
}

/** Regular timetable — `GET /v3/Rail/TRA/GeneralTrainTimetable[/TrainNo/{TrainNo}]`. */
export interface TraGeneralTimetables extends TraTimetableWrapperHeader {
  TrainTimetables: TraGeneralTrainTimetable[];
}

/** Days a regular station departure runs (GeneralStationTimetable.ServiceDay), as booleans. */
export interface TraStationServiceDay {
  ServiceTag?: string | null;
  Monday: boolean;
  Tuesday: boolean;
  Wednesday: boolean;
  Thursday: boolean;
  Friday: boolean;
  Saturday: boolean;
  Sunday: boolean;
  NationalHolidays?: boolean | null;
  DayBeforeHoliday?: boolean | null;
  DayAfterHoliday?: boolean | null;
  TyphoonDay?: boolean | null;
}

/** One departure in a station timetable (GeneralStationTimetable.Timetable / StationTimetable.TimeTable). */
export interface TraStationTimetableEntry {
  Sequence?: number | null;
  TrainNo?: string | null;
  DestinationStationID?: string | null;
  DestinationStationName?: TraNameType | null;
  TrainTypeID?: string | null;
  TrainTypeCode?: TraTrainTypeCode | null;
  TrainTypeName?: TraNameType | null;
  ArrivalTime?: string | null;
  DepartureTime?: string | null;
  /** Daily timetables only: 0 = runs, 1 = suspended at this station. */
  SuspendedFlag?: TraFlag | null;
  /** Daily timetables only. */
  ServiceType?: TraServiceType | null;
}

/** Regular departures from a station in one direction (GeneralStationTimetable). */
export interface TraGeneralStationTimetable {
  RouteID?: string | null;
  StationID: string;
  StationName?: TraNameType | null;
  Direction: TraDirection;
  Timetables: TraStationTimetableEntry[];
  ServiceDay: TraStationServiceDay;
}

/** Regular station timetables — `GET /v3/Rail/TRA/GeneralStationTimetable[/Station/{StationID}]`. */
export interface TraGeneralStationTimetables extends TraTimetableWrapperHeader {
  StationTimetables: TraGeneralStationTimetable[];
}

/** Departures from a station on one day in one direction (DailyStationTimeTable.StationTimetable). */
export interface TraStationTimetable {
  RouteID?: string | null;
  StationID?: string | null;
  StationName?: TraNameType | null;
  Direction?: TraDirection | null;
  /** TDX's capitalisation. */
  TimeTables: TraStationTimetableEntry[];
}

/** Daily station timetables — `GET /v3/Rail/TRA/DailyStationTimetable/…`. One item per station and direction holds every train of the day. */
export interface TraStationTimetables extends TraWrapperHeader {
  AuthorityCode?: string;
  /** `yyyy-MM-dd`. */
  TrainDate: string;
  StationTimetables: TraStationTimetable[];
}

/** Dates the daily timetable covers — `GET /v3/Rail/TRA/DailyTrainTimetable/TrainDates`. */
export interface TraTrainDates {
  UpdateTime: DateTimeString;
  UpdateInterval: number;
  AuthorityCode: string;
  StartDate: string;
  EndDate: string;
  /** `yyyy-MM-dd` strings, about two months. */
  TrainDates: string[];
  Count: number;
}

/** Line (TRA.Line). */
export interface TraLine {
  LineNo: string;
  /** e.g. `WL` 西部幹線, `EL` 東部幹線, `CZ` 成追線. */
  LineID: string;
  LineName: ZhEnName;
  LineSectionName: ZhEnName;
  LineColor?: string | null;
  IsBranch: boolean;
  LineGroup?: string | null;
  LineURL?: string | null;
}

/** Lines — `GET /v3/Rail/TRA/Line`. */
export interface TraLines extends TraWrapperHeader {
  AuthorityCode: string;
  Lines: TraLine[];
}

/** Station of a line (StationOfLine.LineStation). */
export interface TraLineStation {
  Sequence: number;
  StationID: string;
  StationName: TraNameType;
  /** Kilometres from the start of the line. */
  CumulativeDistance: number;
}

/** Ordered stations of a line (StationOfLine). */
export interface TraStationOfLine {
  LineNo: string;
  LineID: string;
  Stations: TraLineStation[];
}

/** Stations of every line — `GET /v3/Rail/TRA/StationOfLine`. */
export interface TraStationOfLines extends TraWrapperHeader {
  AuthorityCode: string;
  StationOfLines: TraStationOfLine[];
}

/** Train type (TRA.TrainType). Several IDs share one `TrainTypeCode`. */
export interface TraTrainType {
  /** e.g. `1100`. */
  TrainTypeID: string;
  TrainTypeCode: TraTrainTypeCode;
  TrainTypeName: TraNameType;
}

/** Train types — `GET /v3/Rail/TRA/TrainType`. */
export interface TraTrainTypes extends TraWrapperHeader {
  AuthorityCode: string;
  TrainTypes: TraTrainType[];
}

/** One exit of a station (StationExit.Exit). */
export interface TraExit {
  /** Composite, e.g. `0900-S Station (Zhongshan 1st Rd.)`. */
  ExitID: string;
  ExitName: ZhEnName;
  ExitPosition: PointType;
  Bearing?: string | null;
  RoadName?: string | null;
  LocationDescription?: string | null;
  Stair?: boolean | null;
  /** 0 none, 1 both ways, 2 exit only, 3 entry only. */
  Escalator: number;
  Elevator?: boolean | null;
}

/** Map image of a station's exits (StationExit.ExitMapURL). */
export interface TraExitMapURL {
  MapName: ZhEnName;
  MapURL?: string | null;
  FloorLevel?: string | null;
}

/** Exits of a station (StationExit). */
export interface TraStationExit {
  StationID: string;
  StationName: TraNameType;
  Exits: TraExit[];
  ExitMapURLs?: TraExitMapURL[] | null;
}

/** Station exits — `GET /v3/Rail/TRA/StationExit`. */
export interface TraStationExits extends TraWrapperHeader {
  AuthorityCode: string;
  StationExits: TraStationExit[];
}

/** Location of a facility (StationFacility.FacilityInfo). Live data can send `Description: ""`. */
export interface TraFacilityInfo {
  Description: string;
  FloorLevel?: string | null;
}

/** Map image of a station's facilities (StationFacility.FacilityMapURL). */
export interface TraFacilityMapURL {
  MapName: ZhEnName;
  MapURL: string;
  FloorLevel?: string | null;
}

/** Facilities of a station (StationFacility). */
export interface TraStationFacility {
  StationID: string;
  StationName: TraNameType;
  FacilityMapURLs: TraFacilityMapURL[];
  Elevators: TraFacilityInfo[];
  InformationSpots: TraFacilityInfo[];
  DrinkingFountains: TraFacilityInfo[];
  Toilets: TraFacilityInfo[];
}

/** Station facilities — `GET /v3/Rail/TRA/StationFacility`. */
export interface TraStationFacilities extends TraWrapperHeader {
  AuthorityCode: string;
  StationFacilities: TraStationFacility[];
}

/** News item (TRANewsList.News). `Description` can contain HTML. */
export interface TraNews {
  NewsID: string;
  /** 1 Zh_tw, 2 En_us, 3 Zh_cn, 4 Ja, 5 Ko, 99 other. */
  Language: number;
  Department?: string | null;
  Title: string;
  /** 1 最新消息, 2 新聞稿, 3 營運資訊, 4 轉乘資訊, 5 活動訊息, 6 系統公告, 7-9 platform notices, 99 其他. */
  NewsCategory: number;
  Description: string;
  NewsURL?: string | null;
  AttachmentURL?: string | null;
  StartTime?: DateTimeString | null;
  EndTime?: DateTimeString | null;
  PublishTime: DateTimeString;
  UpdateTime: DateTimeString;
}

/** News — `GET /v3/Rail/TRA/News`. */
export interface TraNewsList extends TraWrapperHeader {
  AuthorityCode: string;
  Newses: TraNews[];
}

/** Dates a special train runs (TRA.Common.SpecialDay). Live data sends timestamps and `Dates: ""`. */
export interface TraSpecialDay {
  /** Comma-separated non-consecutive dates, or `""`. */
  Dates?: string | null;
  StartDate?: string | null;
  EndDate?: string | null;
  /** 0 停止營運, 1 正常營運, 2 加班營運. */
  ServiceStatus?: 0 | 1 | 2 | null;
  Description?: string | null;
}

/** One special (event or holiday) train (SpecificTrainTimetable). */
export interface TraSpecificTrainTimetable {
  TrainInfo: TraGeneralTrainInfo;
  StopTimes: TraGeneralStopTime[];
  SpecialDay: TraSpecialDay;
}

/** Special train timetables — `GET /v3/Rail/TRA/SpecificTrainTimetable[/TrainNo/{TrainNo}]`. */
export interface TraSpecificTimetables extends TraTimetableWrapperHeader {
  TrainTimetables: TraSpecificTrainTimetable[];
}

/** Segment between two stations of a line (LineNetwork.LineSegment). */
export interface TraLineSegment {
  /** e.g. `2260-3350`. */
  LineSegmentID: string;
  LineSegmentName: TraNameType;
  FromStationID: string;
  ToStationID: string;
  /** `M` main line, `B` branch. */
  SegmentType: OpenString<'M' | 'B'>;
  /** Kilometres. */
  Distance: number;
}

/** Topology of a line (LineNetwork). */
export interface TraLineNetwork {
  LineID: string;
  LineName: TraNameType;
  LineSegments?: TraLineSegment[] | null;
}

/** Line topology — `GET /v3/Rail/TRA/LineNetwork`. */
export interface TraLineNetworks extends TraWrapperHeader {
  AuthorityCode: string;
  LineNetworks: TraLineNetwork[];
}

/** Transfer between two lines at a station (TRA.LineTransfer). */
export interface TraLineTransfer {
  FromLineID: string;
  FromLineName: TraNameType;
  FromStationID: string;
  FromStationName: TraNameType;
  ToLineID: string;
  ToLineName: TraNameType;
  ToStationID: string;
  ToStationName: TraNameType;
  /** Minutes. */
  MinTransferTime: number;
  /** Often `""`. */
  TransferDescription: string;
}

/** Line transfers — `GET /v3/Rail/TRA/LineTransfer`. */
export interface TraLineTransfers extends TraWrapperHeader {
  AuthorityCode: string;
  LineTransfers: TraLineTransfer[];
}

/** Fields shared by the transfer kinds of a station (StationTransfer.*Transfer). */
export interface TraTransferBase {
  /** Transport mode code, e.g. `Car`, `Taxi`. */
  Mode: string;
  /** Minutes. */
  MinTransferTime?: number | null;
  FloorLevel?: string | null;
  Description?: string | null;
  IsOnSiteTransfer?: boolean | null;
}

/** Transfer to another rail system (StationTransfer.RailTransfer). */
export interface TraRailTransfer extends TraTransferBase {
  OperatorCode: string;
  OperatorName: TraNameType;
  StationID: string;
  StationName: TraNameType;
}

/** Transfer to a bus route (StationTransfer.BusTransfer). */
export interface TraBusTransfer extends TraTransferBase {
  OperatorCode: string;
  OperatorName: TraNameType;
  RouteID: string;
  RouteName: TraNameType;
  StopID: string;
  StopName: TraNameType;
  Destination: string;
  Platform?: string | null;
}

/** Transfer to an airport (StationTransfer.AirportTransfer). */
export interface TraAirportTransfer extends TraTransferBase {
  OperatorCode: string;
  OperatorName: TraNameType;
  AirportID: string;
  AirportName: TraNameType;
}

/** Transfer to a public bike station (StationTransfer.BikeTransfer). */
export interface TraBikeTransfer extends TraTransferBase {
  OperatorCode: string;
  OperatorName: TraNameType;
  StationID: string;
  StationName: TraNameType;
}

/** Transfer to a car park (StationTransfer.ParkingTransfer). */
export interface TraParkingTransfer extends TraTransferBase {
  CarParkID: string;
  CarParkName: TraNameType;
}

/** Transfer to a taxi stand (StationTransfer.TaxiTransfer). */
export interface TraTaxiTransfer extends TraTransferBase {
  TaxiStopID?: string | null;
  TaxiStopName: TraNameType;
}

/** Transfer to a ferry pier (StationTransfer.FerryTransfer). */
export interface TraFerryTransfer extends TraTransferBase {
  OperatorCode: string;
  OperatorName: TraNameType;
  FerryStationID?: string | null;
  FerryStationName: TraNameType;
}

/** Transfers from one exit (StationTransfer.Transfer). Live data sends `ExitID: ""`. */
export interface TraExitTransfer {
  ExitID: string;
  ExitName: string;
  RailTransfers: TraRailTransfer[];
  BusTransfers: TraBusTransfer[];
  AirportTransfers: TraAirportTransfer[];
  BikeTransfers: TraBikeTransfer[];
  ParkingTransfers: TraParkingTransfer[];
  TaxiTransfers: TraTaxiTransfer[];
  FerryTransfers: TraFerryTransfer[];
}

/** Map link in a station transfer record (StationTransfer.MapURL). */
export interface TraTransferMapURL {
  MapName: string;
  MapURL: string;
  FloorLevel?: string | null;
}

/** Transfers to other modes at a station (StationTransfer). */
export interface TraStationTransfer {
  StationID: string;
  StationName: TraNameType;
  TransferDescription?: string | null;
  InteriorMapURLs: TraTransferMapURL[];
  ExteriorMapURLs: TraTransferMapURL[];
  Transfers: TraExitTransfer[];
}

/** Station transfers — `GET /v3/Rail/TRA/StationTransfer`. */
export interface TraStationTransfers extends TraWrapperHeader {
  AuthorityCode: string;
  StationTransfers: TraStationTransfer[];
}

/** Network map link (Network.NetworkMapURL): an object with a URL per language, not a string. */
export interface TraNetworkMapURL {
  MapName: string;
  Zh_tw: string;
  En?: string | null;
}

/** Line of a network (Network.Line). Live data sends only `LineID`. */
export interface TraNetworkLine {
  LineNo?: string | null;
  LineID: string;
}

/** The operator's network (Network). */
export interface TraNetwork {
  /** e.g. `TRA-Network`. */
  NetworkID: string;
  NetworkName: TraNameType;
  OperatorCode: string;
  OperatorName: TraNameType;
  NetworkMapURL: TraNetworkMapURL;
  Lines: TraNetworkLine[];
}

/** Networks — `GET /v3/Rail/TRA/Network`. */
export interface TraNetworks extends TraWrapperHeader {
  AuthorityCode: string;
  Networks: TraNetwork[];
}

/** Operator (TRA.Operator). */
export interface TraOperator {
  OperatorCode: string;
  OperatorName: TraNameType;
  OperatorPhone?: string | null;
  OperatorEmail?: string | null;
  OperatorURL?: string | null;
  FareURL?: string | null;
  ReservationURL?: string | null;
  ReservationPhone?: string | null;
  OperatorLogoURL?: string | null;
}

/** Operators — `GET /v3/Rail/TRA/Operator`. */
export interface TraOperators extends TraWrapperHeader {
  AuthorityCode: string;
  Operators: TraOperator[];
}

/** Line geometry (TRA.Shape); `Geometry` is WKT (`LINESTRING` / `MULTILINESTRING`). */
export interface TraShape {
  /** e.g. `B-CZ`. */
  LineNo: string;
  LineID: string;
  LineName: TraNameType;
  Geometry: string;
  UpdateTime: DateTimeString;
}

/** Shapes — `GET /v3/Rail/TRA/Shape`. Live data sends `UpdateInterval: -1`. */
export interface TraShapes extends TraWrapperHeader {
  AuthorityCode: string;
  Shapes: TraShape[];
}
