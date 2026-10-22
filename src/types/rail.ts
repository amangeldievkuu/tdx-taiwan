/**
 * Cross-system rail types (`/v2/Rail/*`): operators, station-to-station and origin-destination
 * distances, and fares looked up by station **name**. Transcribed from the 公共運輸-軌道 v2
 * OpenAPI spec; nullability follows live data where the two differ.
 */
import type { DateTimeString, NameType, OpenString } from './common.js';

/** Systems accepted by `ODDistance`: Taipei and New Taipei share `TRTC_NTMC`. */
export type RailODSystem = OpenString<
  'TRTC_NTMC' | 'KRTC' | 'TYMC' | 'TMRT' | 'NTDLRT' | 'NTALRT' | 'KLRT' | 'TRA' | 'THSR' | 'AFR'
>;

/** Systems accepted by `ODFare` (the same as `RailODSystem` without `AFR`). */
export type RailODFareSystem = OpenString<
  'TRTC_NTMC' | 'KRTC' | 'TYMC' | 'TMRT' | 'NTDLRT' | 'NTALRT' | 'KLRT' | 'TRA' | 'THSR'
>;

/** Systems accepted by `S2SDistance` (here `TRTC` and `NTMC` are separate). */
export type RailS2SSystem = OpenString<
  'TRTC' | 'KRTC' | 'TYMC' | 'TMRT' | 'NTDLRT' | 'NTMC' | 'NTALRT' | 'KLRT' | 'TRA' | 'THSR' | 'AFR'
>;

/** Rail operator (Shared.Base.Operator) — `GET /v2/Rail/Operator`. */
export interface RailOperator {
  /** Data provider code, e.g. `028`. */
  ProviderID: string;
  /** e.g. `KRTC`. */
  OperatorID: string;
  OperatorName: NameType;
  OperatorPhone?: string | null;
  OperatorEmail?: string | null;
  OperatorUrl?: string | null;
  ReservationUrl?: string | null;
  ReservationPhone?: string | null;
  OperatorCode: string;
  AuthorityCode: string;
  SubAuthorityCode?: string | null;
  /** 交通部票證資料系統 operator number, e.g. `5103`. */
  OperatorNo: string;
  UpdateTime: DateTimeString;
}

/** A station in an OD distance record (GIST.ODStationInfo); the name is a plain string. */
export interface RailODStation {
  /** Composite for shared stations looked up by name, e.g. `BL07_Y16`. */
  StationID?: string | null;
  StationName?: string | null;
}

/**
 * Distance between two stations (GIST.RailODStation) —
 * `GET /v2/Rail/ODDistance/{RailSystem}[/{OriginStationName}/to/{DestinationStationName}]`.
 */
export interface RailODDistance {
  Origin: RailODStation;
  Destination: RailODStation;
  /** Kilometres. */
  Distance?: number | null;
}

/**
 * One fare in a by-name fare lookup (GIST.ODFare). Every label is free text in Chinese
 * (`一般票`, `成人`, `標準座車廂`), `""` when not applicable.
 */
export interface RailODFareItem {
  TrainType?: string | null;
  Direction?: string | null;
  TicketType?: string | null;
  FareClass?: string | null;
  CabinClass?: string | null;
  /** NT$. */
  Price?: number | null;
}

/**
 * Fares between two stations looked up by name (GIST.RailODFare) —
 * `GET /v2/Rail/ODFare/{RailSystem}/{OriginStationName}/to/{DestinationStationName}`.
 */
export interface RailODFare {
  Origin: RailODStation;
  Destination: RailODStation;
  ODFares?: RailODFareItem[] | null;
}

/** A station in a station-to-station distance record (GIST.StationInfo); names are `Zh_tw` only. */
export interface RailS2SStation {
  StationID?: string | null;
  StationName?: Partial<NameType> | null;
}

/** Distance between two adjacent stations (GIST.RailStationInfo). */
export interface RailS2SSegment {
  Sequence?: number | null;
  /** Kilometres. */
  Distance?: number | null;
  From: RailS2SStation;
  To: RailS2SStation;
}

/**
 * Adjacent-station distances of a line (GIST.RailLineStation) —
 * `GET /v2/Rail/S2SDistance/{RailSystem}`. `LineName` is `Zh_tw` only.
 */
export interface RailS2SDistance {
  LineNo?: string | null;
  LineID?: string | null;
  LineName?: Partial<NameType> | null;
  Stations?: RailS2SSegment[] | null;
}
