/**
 * Alishan Forest Railway (阿里山林業鐵路, `/v3/Rail/AFR/*`) types. TDX calls the schema family
 * "LiteTrain"; it reuses the TRA v3 common types, so names, fares, stops and news come from
 * `./tra.js`. Transcribed from the 公共運輸-軌道 v3 OpenAPI spec; nullability follows live data.
 */
import type { DateTimeString, OpenString, PointType } from './common.js';
import type {
  TraFare,
  TraFlag,
  TraGeneralStopTime,
  TraGeneralTrainInfo,
  TraLine,
  TraLineStation,
  TraNameType,
  TraNetwork,
  TraNews,
  TraOperator,
  TraShape,
  TraWrapperHeader,
} from './tra.js';

/** Station ID, e.g. `360` 嘉義, `378` 阿里山. */
export type AfrStationId = string;

/** 車種簡碼: 1 中興號, 2 區間, 3 主題式列車, 5 阿里山號, 6 祝客, 7 祝客(祝山線), 8 檜木車廂. */
export type AfrTrainTypeCode = OpenString<'1' | '2' | '3' | '5' | '6' | '7' | '8'>;

/** Header shared by the AFR wrappers. */
export interface AfrWrapperHeader extends TraWrapperHeader {
  AuthorityCode: string;
}

/** Station (LiteTrain.Station). */
export interface AfrStation {
  /** e.g. `AFR-360`. */
  StationUID: string;
  StationID: AfrStationId;
  ReservationCode?: string | null;
  StationName: TraNameType;
  StationPosition: PointType;
  StationAddress?: string | null;
  StationPhone?: string | null;
  StationURL?: string | null;
  /** 0 特等 … 7 其他 in the spec; live data also sends `X`. */
  StationClass: string;
}

/** Stations — `GET /v3/Rail/AFR/Station`. */
export interface AfrStations extends AfrWrapperHeader {
  Stations: AfrStation[];
}

/** Line (LiteTrain.Line): the same fields as a TRA line. */
export type AfrLine = TraLine;

/** Lines — `GET /v3/Rail/AFR/Line`. */
export interface AfrLines extends AfrWrapperHeader {
  Lines: AfrLine[];
}

/** Ordered stations of a line (LiteTrain.StationOfLine). */
export interface AfrStationOfLine {
  LineNo: string;
  LineID: string;
  Stations: TraLineStation[];
}

/** Stations of every line — `GET /v3/Rail/AFR/StationOfLine`. */
export interface AfrStationOfLines extends AfrWrapperHeader {
  StationOfLines: AfrStationOfLine[];
}

/**
 * Service route (LiteTrain.Route). Live data sends `StartStationName` / `EndStationName` with
 * `Zh_tw` and `En` swapped.
 */
export interface AfrRoute {
  LineNo?: string | null;
  LineID: string;
  RouteID: string;
  OperatorCode: string;
  RouteName: TraNameType;
  /** 36 live. */
  RouteType: number;
  StartStationID: string;
  StartStationName: TraNameType;
  EndStationID: string;
  EndStationName: TraNameType;
  RouteURL: string;
  /** Kilometres (absent live). */
  RouteDistance?: number | null;
}

/** Routes — `GET /v3/Rail/AFR/Route`. */
export interface AfrRoutes extends AfrWrapperHeader {
  Routes: AfrRoute[];
}

/** Ordered stations of a route (LiteTrain.StationOfRoute). `RouteName` is `Zh_tw` only live. */
export interface AfrStationOfRoute {
  LineNo: string;
  LineID: string;
  RouteID: string;
  RouteName: TraNameType;
  /** 0 去程, 1 返程. */
  Direction: 0 | 1;
  Stations: TraLineStation[];
}

/** Stations of every route — `GET /v3/Rail/AFR/StationOfRoute`. */
export interface AfrStationOfRoutes extends AfrWrapperHeader {
  StationOfRoutes: AfrStationOfRoute[];
}

/** Network (LiteTrain.Network): the same shape as the TRA network. */
export type AfrNetwork = TraNetwork;

/** Networks — `GET /v3/Rail/AFR/Network`. */
export interface AfrNetworks extends AfrWrapperHeader {
  Networks: AfrNetwork[];
}

/** Line geometry (LiteTrain.Shape): WKT `MULTILINESTRING`. */
export type AfrShape = TraShape;

/** Shapes — `GET /v3/Rail/AFR/Shape`. */
export interface AfrShapes extends AfrWrapperHeader {
  Shapes: AfrShape[];
}

/** Operator (LiteTrain.Operator): the same fields as the TRA operator. */
export type AfrOperator = TraOperator;

/** Operators — `GET /v3/Rail/AFR/Operator`. */
export interface AfrOperators extends AfrWrapperHeader {
  Operators: AfrOperator[];
}

/** Train type (LiteTrain.TrainType). */
export interface AfrTrainType {
  TrainTypeID: string;
  TrainTypeName: TraNameType;
  TrainTypeCode: AfrTrainTypeCode;
}

/** Train types — `GET /v3/Rail/AFR/TrainType`. */
export interface AfrTrainTypes extends AfrWrapperHeader {
  TrainTypes: AfrTrainType[];
}

/** Days a train runs (TRA.Common.ServiceDay as AFR sends it: no `TyphoonDay`). */
export interface AfrServiceDay {
  /** e.g. `請參閱官網`. */
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
  TyphoonDay?: TraFlag | null;
}

/** One regular train (LiteTrain.GeneralTrainTimetable). `TrainInfo` has no train type live. */
export interface AfrGeneralTrainTimetable {
  TrainInfo: TraGeneralTrainInfo;
  StopTimes: TraGeneralStopTime[];
  ServiceDay: AfrServiceDay;
}

/**
 * Regular timetable — `GET /v3/Rail/AFR/GeneralTrainTimetable[/TrainNo/{TrainNo}]`. Live data
 * omits `AuthorityCode`, `ExpireDate` and `ValidityDesciption`.
 */
export interface AfrGeneralTimetables extends TraWrapperHeader {
  AuthorityCode?: string | null;
  EffectiveDate: string;
  ExpireDate?: string | null;
  SrcVersion?: string | null;
  TimetableName?: string | null;
  /** TDX's spelling. */
  ValidityDesciption?: string | null;
  TrainTimetables: AfrGeneralTrainTimetable[];
}

/** Fares between two stations for one train type (LiteTrain.ODFare). */
export interface AfrODFare {
  OriginStationID: string;
  OriginStationName: TraNameType;
  DestinationStationID: string;
  DestinationStationName: TraNameType;
  /** 0 順行, 1 逆行. */
  Direction?: 0 | 1 | null;
  /** Train type code as a number (1 中興號, 5 阿里山號 live). */
  TrainType: number;
  Fares: TraFare[];
  /** Kilometres. */
  TravelDistance?: number | null;
}

/**
 * Fares — `GET /v3/Rail/AFR/ODFare[/{O}/to/{D}]`. Live data omits `AuthorityCode` and
 * `SrcVersion`; `EffectiveDate` is a bare date and `ExpireDate` is `""`.
 */
export interface AfrODFares extends TraWrapperHeader {
  AuthorityCode?: string | null;
  EffectiveDate?: string | null;
  ExpireDate?: string | null;
  SrcVersion?: string | null;
  ODFares: AfrODFare[];
}

/** News item (TRANewsList.News), shared with TRA. */
export type AfrNews = TraNews;

/** News — `GET /v3/Rail/AFR/News`. */
export interface AfrNewsList extends AfrWrapperHeader {
  Newses: AfrNews[];
}

/** Re-exported so `AfrGeneralTimetables` consumers need not import the TRA module. */
export type { DateTimeString as AfrDateTimeString };
