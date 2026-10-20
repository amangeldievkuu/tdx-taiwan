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
