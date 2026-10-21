// Air (航空) types, transcribed from the TDX 公共運輸-航空 v2 OpenAPI spec
// (PTX.Service.DTO.Air.Specification.V2.*). Where live data contradicts the spec, the type
// follows the data and says so; the counts in comments come from checking every endpoint on
// 2026-10-21. Optional (`?`) means the field is not in the schema's `required` list; the spec
// marks nothing nullable.
import type { DateTimeString, OpenString, PointType, ZhEnName } from './common.js';

/**
 * Multilingual name as the Air endpoints return it. Unlike `NameType`, both parts can be
 * missing: `AirportCityName` is `{}` for 302 of 469 airports and `AirportName` for one.
 */
export type AirName = ZhEnName;

/**
 * IATA codes of Taiwan's airports: `TPE` 桃園, `TSA` 臺北松山, `KHH` 高雄, `RMQ` 臺中,
 * `TNN` 臺南, `CYI` 嘉義, `HUN` 花蓮, `TTT` 臺東, `MZG` 澎湖, `KNH` 金門, `MFK` 馬祖北竿,
 * `LZN` 馬祖南竿, `KYD` 蘭嶼, `GNI` 綠島, `WOT` 望安, `CMJ` 七美, `HCN` 恆春. Any other IATA
 * code is accepted (the airport list covers 469 airports worldwide).
 */
export type AirAirportId = OpenString<
  | 'TPE'
  | 'TSA'
  | 'KHH'
  | 'RMQ'
  | 'TNN'
  | 'CYI'
  | 'HUN'
  | 'TTT'
  | 'MZG'
  | 'KNH'
  | 'MFK'
  | 'LZN'
  | 'KYD'
  | 'GNI'
  | 'WOT'
  | 'CMJ'
  | 'HCN'
>;

/**
 * 航線種類: -2 = 特殊 (special), 1 = 國際 (international), 2 = 國內 (domestic), 3 = 兩岸
 * (cross-strait), 4 = 國際包機 (international charter), 5 = 國內包機 (domestic charter),
 * 6 = 兩岸包機 (cross-strait charter).
 */
export type AirRouteType = -2 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Flight time as the FIDS endpoints return it: `yyyy-MM-ddTHH:mm` in Taiwan local time with
 * **no UTC offset** (e.g. `2026-10-21T08:50`). Append `+08:00` before parsing it as an instant.
 */
export type AirLocalDateTime = string;

/** Airport (Airport) — `GET /v2/Air/Airport` and `/v2/Air/Airport/{IATA}`. */
export interface AirAirport {
  /** IATA code, e.g. `TPE`. */
  AirportID: string;
  /** Airport name. `{}` for one airport in live data. */
  AirportName: AirName;
  /** IATA code. */
  AirportIATA?: string;
  /** ICAO code, e.g. `RCTP`. */
  AirportICAO?: string;
  /** Position (WGS84). `{}` for every airport outside Taiwan (452 of 469). */
  AirportPosition: PointType;
  /** City the airport serves. `{}` for 302 of 469 airports. */
  AirportCityName: AirName;
  /** Address. Only the Taiwan airports have one. */
  AirportAddress?: string;
  /** Phone number. Only the Taiwan airports have one. */
  AirportPhone?: string;
  /** Country code, e.g. `TW`. */
  AirportNationality?: string;
  /** Authority code, e.g. `CAA`. */
  AuthorityID?: string;
  UpdateTime: DateTimeString;
  VersionID: number;
}

/** Airline (Airline) — `GET /v2/Air/Airline` and `/v2/Air/Airline/{IATA}`. */
export interface AirAirline {
  /** IATA code, e.g. `CI`. `""` for 4 of 852 airlines in live data. */
  AirlineID: string;
  AirlineName: AirName;
  /** Short name. `{}` for some airlines. */
  AirlineNameAlias: AirName;
  /** IATA code. */
  AirlineIATA?: string;
  /** ICAO code, e.g. `CAL`. */
  AirlineICAO?: string;
  AirlineEmail?: string;
  AirlineAddress?: string;
  AirlinePhone?: string;
  /** Country code, e.g. `TW`. */
  AirlineNationality?: string;
  UpdateTime: DateTimeString;
  VersionID: number;
}

/** Fields shared by every FIDS record. */
export interface AirFlightBase {
  /** Flight date, `yyyy-MM-dd`. */
  FlightDate: string;
  /** Flight number digits only, e.g. `100`; the airline is `AirlineID`. */
  FlightNumber: string;
  /** Route type. Present on `flights` records; absent on airport departure and arrival boards. */
  AirRouteType?: AirRouteType;
  /** Airline IATA code, e.g. `CI`. */
  AirlineID: string;
  /** Origin airport IATA code. */
  DepartureAirportID: string;
  /** Destination airport IATA code. */
  ArrivalAirportID: string;
  /** Code-share flight numbers. Never present in live data. */
  CodeShare?: string;
  /** Whether this is a cargo flight. */
  IsCargo?: boolean;
  /** Aircraft type, e.g. `A350-900`. */
  AcType?: string;
  /** Baggage carousel (arrivals only). */
  BaggageClaim?: string;
  /** Check-in counter (departures only). `""` when unknown. */
  CheckCounter?: string;
  UpdateTime: DateTimeString;
}

/**
 * Departure board row (FIDSDeparture) — `GET /v2/Air/FIDS/Airport/Departure[/{IATA}]`.
 *
 * Remarks are free text as the airport publishes them: TPE joins Chinese and English in one
 * string (`出發DEPARTED`, `準時ON TIME`, `取消CANCELLED`); domestic airports use Chinese only
 * (`準時`, `報到`, `登機`, `出發`, `已飛`, `延誤`, `取消`). `DepartureRemarkEn` is in the spec but
 * never present in live data.
 */
export interface AirDeparture extends AirFlightBase {
  ScheduleDepartureTime?: AirLocalDateTime;
  /** Songshan (TSA) fills this with the scheduled time before departure; trust the remark. */
  ActualDepartureTime?: AirLocalDateTime;
  EstimatedDepartureTime?: AirLocalDateTime;
  /** Status from the airport's point of view. */
  DepartureRemark?: string;
  DepartureRemarkEn?: string;
  /** Terminal. `""` when unknown. */
  Terminal?: string;
  /** Gate (passenger flights). `""` when unknown; TPE sometimes pads it (`" A8"`). */
  Gate?: string;
  /** Apron (cargo flights). */
  Apron?: string;
}

/**
 * Arrival board row (FIDSArrival) — `GET /v2/Air/FIDS/Airport/Arrival[/{IATA}]`. Remarks
 * follow the same conventions as `AirDeparture` (`已到ARRIVED`, `抵達`, `預計14:00到站`).
 */
export interface AirArrival extends AirFlightBase {
  ScheduleArrivalTime?: AirLocalDateTime;
  ActualArrivalTime?: AirLocalDateTime;
  EstimatedArrivalTime?: AirLocalDateTime;
  /** Status from the airport's point of view. */
  ArrivalRemark?: string;
  ArrivalRemarkEn?: string;
  /** Terminal. `""` when unknown. */
  Terminal?: string;
  /** Gate (passenger flights). `""` when unknown. */
  Gate?: string;
  /** Apron (cargo flights). */
  Apron?: string;
}

/**
 * Flight record with both legs (FIDS) — `GET /v2/Air/FIDS/Flight[/{FlightNo}]`. The
 * `FlightStatus*` and `FlightRemark` fields are in the spec but never present in live data.
 */
export interface AirFlight extends AirFlightBase {
  ScheduleDepartureTime?: AirLocalDateTime;
  ActualDepartureTime?: AirLocalDateTime;
  EstimatedDepartureTime?: AirLocalDateTime;
  ScheduleArrivalTime?: AirLocalDateTime;
  ActualArrivalTime?: AirLocalDateTime;
  EstimatedArrivalTime?: AirLocalDateTime;
  /** Departure status (source: 民航局 CAA). */
  DepartureRemark?: string;
  DepartureRemarkEn?: string;
  /** Arrival status from the arrival airport's point of view. */
  ArrivalRemark?: string;
  ArrivalRemarkEn?: string;
  /** Flight status from the flight's point of view. */
  FlightStatus?: string;
  FlightStatusEn?: string;
  /** Progress percentage (domestic flights). */
  FlightStatusPC?: string;
  FlightRemark?: string;
  ArrivalTerminal?: string;
  DepartureTerminal?: string;
  ArrivalGate?: string;
  DepartureGate?: string;
  ArrivalApron?: string;
  DepartureApron?: string;
}

/**
 * An airport's departure and arrival boards (Airport_FIDS) — `GET /v2/Air/FIDS/Airport[/{IATA}]`.
 * TDX returns an array with one element per airport, even for a single `{IATA}`.
 */
export interface AirAirportBoard {
  /** Airport IATA code. */
  AirportID: string;
  FIDSDeparture: AirDeparture[];
  FIDSArrival: AirArrival[];
  UpdateTime: DateTimeString;
}
