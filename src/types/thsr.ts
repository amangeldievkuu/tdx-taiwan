// Taiwan High Speed Rail types, transcribed from the TDX 公共運輸-軌道 v2 OpenAPI spec
// (PTX.Service.DTO.Rail.Specification.V2.THSR.*). Where live data contradicts the spec,
// the type follows the data and says so.
import type { DateTimeString, NameType, OpenString, PointType } from './common.js';

/**
 * THSR station IDs: `0990` 南港 Nangang, `1000` 台北 Taipei, `1010` 板橋 Banqiao,
 * `1020` 桃園 Taoyuan, `1030` 新竹 Hsinchu, `1035` 苗栗 Miaoli, `1040` 台中 Taichung,
 * `1043` 彰化 Changhua, `1047` 雲林 Yunlin, `1050` 嘉義 Chiayi, `1060` 台南 Tainan,
 * `1070` 左營 Zuoying.
 */
export type ThsrStationId = OpenString<
  | '0990'
  | '1000'
  | '1010'
  | '1020'
  | '1030'
  | '1035'
  | '1040'
  | '1043'
  | '1047'
  | '1050'
  | '1060'
  | '1070'
>;

/** 行駛方向: 0 = 南下 (southbound), 1 = 北上 (northbound), 2 = 雙向 (both). */
export type ThsrDirection = 0 | 1 | 2;

/**
 * 票種類型: 1 = 一般票 (single), 2 = 來回票 (return), 3 = 電子票証 (e-ticket),
 * 4 = 回數票 (multi-ride), 5 = 定期票30天期 (30-day pass), 6 = 定期票60天期 (60-day pass),
 * 7 = 早鳥票 (early bird), 8 = 團體票 (group).
 */
export type ThsrTicketType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * 費率等級: 1 = 成人 (adult), 2 = 學生 (student), 3 = 孩童 (child), 4 = 敬老 (senior),
 * 5 = 愛心 (disabled), 6 = 愛心孩童 (disabled child), 7 = 愛心優待/愛心陪伴 (companion),
 * 8 = 軍警 (military/police), 9 = 法優 (statutory discount).
 */
export type ThsrFareClass = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** 車廂: 1 = 標準座 (standard), 2 = 商務座 (business), 3 = 自由座 (non-reserved). */
export type ThsrCabinClass = 1 | 2 | 3;

/** Remaining reserved seats: `O` = 尚有座位 (available), `L` = 座位有限 (limited), `X` = 已無座位 (sold out). */
export type ThsrSeatStatus = OpenString<'O' | 'L' | 'X'>;

/** 營運狀況: `''` = 正常 (normal), `▲` = 其他的異常狀態 (other disruption), `X` = 全線停止運行 (line stopped). */
export type ThsrAlertStatus = OpenString<'' | '▲' | 'X'>;

/** Station (THSR.RailStation) — `GET /v2/Rail/THSR/Station`. */
export interface ThsrStation {
  /** Unique station ID, e.g. `THSR-1000`. */
  StationUID: string;
  /** Station ID, e.g. `1000`. */
  StationID: string;
  /** Booking system code, e.g. `TPE`. */
  StationCode: string;
  StationName: NameType;
  StationAddress: string;
  StationPhone?: string | null;
  OperatorID: string;
  StationPosition?: PointType | null;
  LocationCity?: string | null;
  LocationCityCode?: string | null;
  LocationTown?: string | null;
  LocationTownCode?: string | null;
  /** TDX update time. */
  UpdateTime: DateTimeString;
  VersionID: number;
}

/** Train information (THSR.TimeInfo.RailDailyTrainInfo). */
export interface ThsrDailyTrainInfo {
  /** Train number, e.g. `0803`. */
  TrainNo: string;
  Direction: ThsrDirection;
  StartingStationID?: string | null;
  StartingStationName?: NameType | null;
  EndingStationID?: string | null;
  EndingStationName?: NameType | null;
  /** Note. A `NameType` in the spec, but live data returns `{}`. */
  Note?: Partial<NameType> | null;
  /** Whether the train runs past midnight. */
  Overnight?: boolean;
}

/** A stop of a train (THSR.RailStopTime). */
export interface ThsrStopTime {
  /** Stop number along the train's run, starting at 1. */
  StopSequence: number;
  StationID: string;
  StationName: NameType;
  /** Arrival time (HH:mm; the spec says HH:mm:ss). */
  ArrivalTime?: string | null;
  /** Departure time (HH:mm; the spec says HH:mm:ss). */
  DepartureTime: string;
}

/**
 * A train between two stations on one day (THSR.RailODDailyTimetable) —
 * `GET /v2/Rail/THSR/DailyTimetable/OD/{OriginStationID}/to/{DestinationStationID}/{TrainDate}`.
 */
export interface ThsrODTimetable {
  /** Service date (YYYY-MM-DD). */
  TrainDate: string;
  DailyTrainInfo: ThsrDailyTrainInfo;
  OriginStopTime: ThsrStopTime;
  DestinationStopTime: ThsrStopTime;
  UpdateTime: DateTimeString;
  VersionID: number;
}

/** One price (THSR.OD.Fare). Discount and group fares beyond these are on the THSR website. */
export interface ThsrFare {
  TicketType: ThsrTicketType;
  FareClass: ThsrFareClass;
  CabinClass: ThsrCabinClass;
  /** Price in NT$. */
  Price: number;
}

/**
 * Fares between two stations (THSR.RailODFare) —
 * `GET /v2/Rail/THSR/ODFare/{OriginStationID}/to/{DestinationStationID}`.
 */
export interface ThsrODFare {
  OriginStationID: string;
  OriginStationName: NameType;
  DestinationStationID: string;
  DestinationStationName: NameType;
  Direction: ThsrDirection;
  Fares: ThsrFare[];
  SrcUpdateTime: DateTimeString;
  UpdateTime: DateTimeString;
  VersionID: number;
}

/** Seat status at one stop of a train (THSR.Old.StopStation). */
export interface ThsrStopStationSeats {
  StopSequence: number;
  StationID: string;
  /** Booking system code. */
  StationCode: string;
  StationName: NameType;
  StandardSeatStatus: ThsrSeatStatus;
  BusinessSeatStatus: ThsrSeatStatus;
}

/** Remaining reserved seats on one train departing a station (THSR.Old.AvailableSeat). */
export interface ThsrAvailableSeat {
  TrainNo: string;
  Direction: ThsrDirection;
  /** The station that was queried. */
  StationID: string;
  StationName: NameType;
  /** Departure time from the queried station (HH:mm). */
  DepartureTime: string;
  EndingStationID: string;
  EndingStationName: NameType;
  /** Seat status for each later stop of the train. */
  StopStations: ThsrStopStationSeats[];
  SrcUpdateTime: DateTimeString;
}

/**
 * Seat availability board for a station —
 * `GET /v2/Rail/THSR/AvailableSeatStatusList/{StationID}`. During disruptions THSR freezes
 * this board at the last normal state.
 */
export interface ThsrAvailableSeats {
  UpdateTime?: DateTimeString | null;
  AvailableSeats: ThsrAvailableSeat[];
  Count?: number | null;
}

/** A section of line affected by an alert (THSRAlertLineSection). */
export interface ThsrAlertLineSection {
  LineID: string | null;
  StartingStationID?: string | null;
  StartingStationName?: string | null;
  EndingStationID?: string | null;
  EndingStationName?: string | null;
  Description?: string | null;
}

/** What an alert affects (THSRAlertScope). */
export interface ThsrAlertScope {
  LineSections?: ThsrAlertLineSection[] | null;
}

/**
 * Service alert (THSR.AlertInfo) — `GET /v2/Rail/THSR/AlertInfo`. On a normal day this is a
 * single "全線營運正常(Normal)" record with an empty `Status`.
 */
export interface ThsrAlert {
  AlertID: string;
  Title: string;
  Description?: string | null;
  Status: ThsrAlertStatus;
  Scope?: ThsrAlertScope | null;
  Direction?: ThsrDirection | null;
  /** 影響等級: 1 = 重度 (severe), 2 = 中度 (moderate), 3 = 輕度 (minor). */
  Level?: 1 | 2 | 3 | null;
  Effect?: string | null;
  Reason?: string | null;
  AlertURL?: string | null;
  OccuredTime?: DateTimeString | null;
  StartTime?: DateTimeString | null;
  EndTime?: DateTimeString | null;
  PublishTime?: DateTimeString | null;
  SrcUpdateTime: DateTimeString;
  UpdateTime: DateTimeString;
}

/** Days a general-timetable train runs (THSR.ServiceDay): 0 = 否, 1 = 是 per weekday. */
export interface ThsrGeneralServiceDay {
  Monday: 0 | 1;
  Tuesday: 0 | 1;
  Wednesday: 0 | 1;
  Thursday: 0 | 1;
  Friday: 0 | 1;
  Saturday: 0 | 1;
  Sunday: 0 | 1;
}

/** Timetable of one train in the general (regular) timetable (THSR.GeneralTimetable). */
export interface ThsrGeneralTimetableDetail {
  GeneralTrainInfo: ThsrDailyTrainInfo;
  StopTimes: ThsrStopTime[];
  ServiceDay: ThsrGeneralServiceDay;
  SrcUpdateTime: DateTimeString;
}

/**
 * Regular timetable entry (THSR.RailGeneralTimetable) — `GET /v2/Rail/THSR/GeneralTimetable[/TrainNo/{TrainNo}]`.
 * Live data sends `UpdateTime` as a bare date and `ExpiringDate` as `""`.
 */
export interface ThsrGeneralTimetable {
  UpdateTime?: string | null;
  /** `yyyy-MM-dd`. */
  EffectiveDate: string;
  /** `yyyy-MM-dd`, or `""` while open-ended. */
  ExpiringDate: string;
  VersionID: number;
  GeneralTimetable: ThsrGeneralTimetableDetail;
}

/** A train's full stop list on one day (THSR.RailDailyTimetable) — `GET /v2/Rail/THSR/DailyTimetable/…`. */
export interface ThsrDailyTimetable {
  /** `yyyy-MM-dd`. */
  TrainDate: string;
  DailyTrainInfo: ThsrDailyTrainInfo;
  StopTimes: ThsrStopTime[];
  UpdateTime: DateTimeString;
  VersionID: number;
}

/** One train calling at a station on a day (THSR.RailStationTimetable) — `GET /v2/Rail/THSR/DailyTimetable/Station/{StationID}/{TrainDate}`. */
export interface ThsrStationTimetable {
  TrainDate: string;
  StationID: string;
  StationName: NameType;
  TrainNo: string;
  Direction: ThsrDirection;
  StartingStationID: string;
  StartingStationName: NameType;
  EndingStationID: string;
  EndingStationName: NameType;
  /** `HH:mm`. */
  ArrivalTime: string;
  DepartureTime: string;
  UpdateTime: DateTimeString;
  VersionID: number;
}

/** Dates the daily timetable covers (THSR.TrainDateList) — `GET /v2/Rail/THSR/DailyTimetable/TrainDates`. */
export interface ThsrTrainDates {
  StartDate: string;
  EndDate: string;
  /** `yyyy-MM-dd` strings, about four weeks. */
  TrainDates: string[];
  UpdateTime: DateTimeString;
}

/** News item (THSR.News) — `GET /v2/Rail/THSR/News`. `Description` is HTML with inline CSS. */
export interface ThsrNews {
  NewsID: string;
  Language: string;
  /** Free text, e.g. `營運資訊`. */
  NewsCategory: string;
  Title: string;
  Description: string;
  NewsUrl: string;
  AttachmentUrlList: string[];
  StartTime: DateTimeString;
  EndTime?: DateTimeString | null;
  PublishTime: DateTimeString;
  UpdateTime: DateTimeString;
}

/** Map image of a station exit (THSR.ExitMapURL). */
export interface ThsrExitMapURL {
  MapName?: NameType | null;
  MapURL?: string | null;
  FloorLevel?: string | null;
}

/** Station exit (THSR.StationExit) — `GET /v2/Rail/THSR/StationExit`. */
export interface ThsrStationExit {
  StationID: string;
  StationName: NameType;
  /** e.g. `North Exit`. */
  ExitID: string;
  ExitName: NameType;
  ExitPosition: PointType;
  LocationDescription: string;
  Stair: boolean;
  Escalator: boolean;
  Elevator: boolean;
  ExitMapURLs?: ThsrExitMapURL[] | null;
  SrcUpdateTime: DateTimeString;
  UpdateTime: DateTimeString;
}

/** A train on a day (THSR.RailDailyTrainInfo) — `GET /v2/Rail/THSR/DailyTrainInfo/…`. */
export interface ThsrTrainInfo extends ThsrDailyTrainInfo {
  UpdateTime: DateTimeString;
  VersionID: number;
}

/** Seat status for the leg from one stop to the next (THSR.StopStation). */
export interface ThsrLegStopStation {
  StopSequence: number;
  StationID: string;
  /** Booking-system code, e.g. `TPE`. */
  StationCode: string;
  StationName: NameType;
  NextStationID: string;
  NextStationCode: string;
  NextStationName: NameType;
  StandardSeatStatus: ThsrSeatStatus;
  BusinessSeatStatus: ThsrSeatStatus;
}

/** Seat status of a train, leg by leg (THSR.AvailableSeat). */
export interface ThsrLegSeat {
  TrainNo: string;
  Direction: ThsrDirection;
  StartingStationID: string;
  StartingStationCode: string;
  StartingStationName: NameType;
  EndingStationID: string;
  EndingStationCode: string;
  EndingStationName: NameType;
  StopStations: ThsrLegStopStation[];
}

/**
 * Leg-level seat status — `GET /v2/Rail/THSR/AvailableSeatStatus/Train/Leg/TrainDate/{d}`.
 * Live data has no update intervals.
 */
export interface ThsrLegSeatStatus {
  UpdateTime?: DateTimeString | null;
  SrcUpdateTime?: DateTimeString | null;
  Count?: number | null;
  /** `yyyy-MM-dd`. */
  TrainDate?: string | null;
  AvailableSeats: ThsrLegSeat[];
}

/** Seat status of a train between two stations (THSR.OD.AvailableSeat). */
export interface ThsrODSeat {
  TrainNo: string;
  Direction: ThsrDirection;
  OriginStationID: string;
  OriginStationCode: string;
  OriginStationName: NameType;
  DestinationStationID: string;
  DestinationStationCode: string;
  DestinationStationName: NameType;
  StandardSeatStatus: ThsrSeatStatus;
  BusinessSeatStatus: ThsrSeatStatus;
}

/**
 * Origin-destination seat status — `GET /v2/Rail/THSR/AvailableSeatStatus/Train/OD/…`.
 * A query with no matching train returns `AvailableSeats: []` without the update times.
 */
export interface ThsrODSeatStatus {
  UpdateTime?: DateTimeString | null;
  /** Seconds (600 live). */
  UpdateInterval?: number | null;
  SrcUpdateTime?: DateTimeString | null;
  SrcUpdateInterval?: number | null;
  Count?: number | null;
  TrainDate?: string | null;
  AvailableSeats: ThsrODSeat[];
}

/** Non-reserved cars of a train (THSR.FreeSeatingCar). */
export interface ThsrFreeSeatingCar {
  /** Without the leading zero, e.g. `108`. */
  TrainNo?: string | null;
  /** e.g. `3: 10-12`. */
  CarConfig?: string | null;
  /** Car numbers, e.g. `[10, 11, 12]`. */
  Cars?: number[] | null;
}

/** Non-reserved cars per train on a day — `GET /v2/Rail/THSR/DailyFreeSeatingCar/TrainDate/{d}`. */
export interface ThsrFreeSeatingCars {
  UpdateTime: DateTimeString;
  UpdateInterval: number;
  AuthorityCode: string;
  TrainDate: string;
  FreeSeatingCars: ThsrFreeSeatingCar[];
  Count?: number | null;
}

/**
 * Line geometry (THSR.THSRShape) — `GET /v2/Rail/THSR/Shape`. One item of about 1 MB whose
 * `Geometry` is WKT.
 */
export interface ThsrShape {
  Geometry: string;
  EncodedPolyline: string;
  LineID: string;
  LineName: NameType;
  UpdateTime: DateTimeString;
}

/** Station of the line (THSR.Station). */
export interface ThsrLineStation {
  Sequence: number;
  StationID: string;
  StationName: NameType;
  /** Kilometres from 南港. */
  CumulativeDistance?: number | null;
}

/** Ordered stations of the line (THSR.StationOfLine) — `GET /v2/Rail/THSR/StationOfLine`. */
export interface ThsrStationOfLine {
  LineNo?: string | null;
  /** `THSR`. */
  LineID: string;
  Stations: ThsrLineStation[];
  UpdateTime: DateTimeString;
}
