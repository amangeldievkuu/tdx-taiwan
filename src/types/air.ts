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

/** `Domestic` or `International` general schedule. */
export type AirScheduleScope = OpenString<'Domestic' | 'International'>;

/** Domestic airlines with daily schedules, fares and seat availability: `AE` 華信, `B7` 立榮, `DA` 德安. */
export type AirDomesticAirline = OpenString<'AE' | 'B7' | 'DA'>;

/**
 * Airport weather observation (METAR) — `GET /v2/Air/METAR/Airport[/{IATA}]`. Every measurement
 * is a string with its unit, as TDX sends it (`"25 KT"`, `"26°C"`, `"9999 M"`); `MetarText` is
 * the raw report.
 */
export interface AirMetar {
  AirportID: string;
  /** ICAO station code, e.g. `RCTP`. */
  StationID: string;
  CountryName: AirName;
  /** `{}` in live data. */
  CityName: AirName;
  AirportName: AirName;
  StationPosition: PointType;
  ObservationTime: DateTimeString;
  /** Raw METAR / SPECI report. */
  MetarText: string;
  MetarTime: DateTimeString;
  /** e.g. `40 degree`. */
  WindDirection: string;
  /** e.g. `25 KT`. */
  WindSpeed: string;
  /** e.g. `9999 M` (10 km or more). */
  Visibility: string;
  /** e.g. `800 FT`. */
  Ceiling: string;
  /** e.g. `26°C`. */
  Temperature: string;
  WeatherDescription: AirName;
  UpdateTime: DateTimeString;
}

/** Code-share flight in a general schedule (CodeShare). */
export interface AirCodeShare {
  AirlineID: string;
  /** Digits only. */
  FlightNumber: string;
}

/**
 * Scheduled flight valid for a date range (GeneralFlightSchedule) —
 * `GET /v2/Air/GeneralSchedule/{Domestic|International}`. Unlike the FIDS records,
 * `FlightNumber` here includes the airline code (`AE1261`), zero-padded to three digits.
 */
export interface AirGeneralSchedule {
  AirlineID: string;
  /** `yyyy-MM-dd`. */
  ScheduleStartDate: string;
  ScheduleEndDate: string;
  /** With the airline prefix, e.g. `AE1261`. */
  FlightNumber: string;
  DepartureAirportID: string;
  /** Local `HH:mm`; `+1` marks the next day. */
  DepartureTime: string;
  /** Always `[]` in live data. */
  CodeShare?: AirCodeShare[];
  ArrivalAirportID: string;
  ArrivalTime: string;
  Monday: boolean;
  Tuesday: boolean;
  Wednesday: boolean;
  Thursday: boolean;
  Friday: boolean;
  Saturday: boolean;
  Sunday: boolean;
  Terminal?: string;
  UpdateTime: DateTimeString;
  VersionID: number;
}

/** Airport reference in schedules and fares (Airport). */
export interface AirScheduleAirport {
  AirportID: string;
  AirportName: AirName;
}

/** Intermediate stop of a daily flight (TransitAirport). */
export interface AirTransitAirport {
  /** From 1. */
  TransitSequence: number;
  TransitAirportID: string;
  TransitCause?: string;
  ArrivalTime: string;
  DepartureTime: string;
}

/** Alternative aircraft type (SecondaryAircraftType). */
export interface AirSecondaryAircraftType {
  /** From 1. */
  Priority: number;
  /** IATA aircraft code. */
  AircraftType: string;
}

/** Code-share flight number on a daily flight (CodeShare). */
export interface AirDailyCodeShare {
  FlightNumber: string;
}

/**
 * One day's scheduled domestic flight (DailyFlightSchedule) —
 * `GET /v2/Air/DailyFlightSchedule/Domestic/{IATA}`. `FlightRemark` is `""` for a normal flight,
 * `X` cancelled, `S` code share. `IsCargo`, `AirFlightType`, `SeatCapacity`, `LoadCapacity` and
 * `FlightDistance` are in the spec but never present in live data.
 */
export interface AirDailyFlightSchedule {
  AirlineID: string;
  /** `DEP-ARR`, e.g. `TSA-KNH`; the `airRoute` of `seatAvailability`. */
  AirRouteID: string;
  /** `yyyy-MM-dd`. */
  FlightDate: string;
  /** Digits only. */
  FlightNumber: string;
  DepartureAirport: AirScheduleAirport;
  /** Local `HH:mm`; `+1` marks the next day. */
  DepartureTime: string;
  TransitAirports?: AirTransitAirport[];
  /** IATA aircraft code, e.g. `AT7`. */
  AircraftType: string;
  SecondaryAircraftTypes?: AirSecondaryAircraftType[];
  CodeShares?: AirDailyCodeShare[];
  ArrivalAirport: AirScheduleAirport;
  ArrivalTime: string;
  FlightRemark: string;
  AirFlightType?: AirRouteType;
  /** 0 = 否, 1 = 是. */
  IsCargo?: 0 | 1;
  SeatCapacity?: number;
  /** Tonnes. */
  LoadCapacity?: number;
  /** Miles. */
  FlightDistance?: number;
  SrcUpdateTime: DateTimeString;
  UpdateTime: DateTimeString;
}

/** 票種類型: 1 = 一般民眾 (general public), 2 = 離島居民 (outlying-island residents). */
export type AirFareTicketType = 1 | 2;

/**
 * 費率等級: 1 = 成人, 2 = 學生, 3 = 孩童, 4 = 敬老, 5 = 愛心, 6 = 愛心孩童, 7 = 愛心優待/愛心陪伴,
 * 8 = 軍警, 9 = 縣府補助愛心, 10 = 縣府補助愛心陪同, 11 = 促銷優惠.
 */
export type AirFareClass = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

/** 艙等: 1 = 頭等艙 (first), 2 = 商務艙 (business), 3 = 豪華經濟艙 (premium economy), 4 = 經濟艙 (economy). */
export type AirCabinClass = 1 | 2 | 3 | 4;

/** One fare of a route (Fare). */
export interface AirFare {
  /** e.g. `全額票`, `敬老票`. */
  FareName: string;
  TicketType: AirFareTicketType;
  FareClass: AirFareClass;
  CabinClass?: AirCabinClass;
  /** NT$. */
  Price: number;
}

/** Published fares of a domestic route (RouteFare) — `GET /v2/Air/RouteFare/Domestic/{IATA}`. */
export interface AirRouteFare {
  AirlineID: string;
  /** `DEP-ARR`, e.g. `HUN-KHH`. */
  AirRouteID: string;
  DepartureAirport: AirScheduleAirport;
  ArrivalAirport: AirScheduleAirport;
  Fares: AirFare[];
  SrcUpdateTime: DateTimeString;
  UpdateTime: DateTimeString;
}

/** 售票狀態: 1 = 尚有空位 (available), 2 = 座位有限 (fewer than 5), 3 = 無座位 (sold out). */
export type AirSeatStatus = 1 | 2 | 3;

/** Seats per cabin class (CabinSeat). */
export interface AirCabinSeat {
  CabinClass: AirCabinClass;
  TotalSeats: number;
  SoldSeats: number;
  SeatStatus: AirSeatStatus;
}

/**
 * Live seats left on a domestic flight (SeatAvailability) —
 * `GET /v2/Air/SeatAvailability/Domestic/{IATA}/AirRoute/{AirRoute}/FlightDate/{FlightDate}/FlightNumber/{FlightNumber}`.
 */
export interface AirSeatAvailability {
  AirlineID: string;
  AirRouteID: string;
  FlightDate: string;
  FlightNumber: string;
  DepartureAirport: AirScheduleAirport;
  ArrivalAirport: AirScheduleAirport;
  TotalSeats?: number;
  SoldSeats?: number;
  SeatStatus: AirSeatStatus;
  CabinSeats?: AirCabinSeat[];
  UpdateTime: DateTimeString;
}

/** 消息類別: 1 = 最新消息 (news), 2 = 營運資訊 (operations), 3 = 通阻資訊 (disruptions), 99 = 其他. */
export type AirNewsCategory = 1 | 2 | 3 | 99;

/** News item (News) — `GET /v2/Air/News`. Published by 民用航空局; `AirportID` and `AirlineID` are `""`. */
export interface AirNews {
  NewsID: string;
  /** `Zh_tw`, `En`, `Zh_cn`, `Ja` or `Ko`. */
  Language: string;
  Department: string;
  AirportID?: string;
  AirlineID?: string;
  Title: string;
  NewsCategory?: AirNewsCategory;
  Description: string;
  ContactName: string;
  ContactPhone: string;
  NewsURL?: string;
  AttachmentURL?: string;
  StartTime?: DateTimeString;
  EndTime?: DateTimeString;
  PublishTime: DateTimeString;
  UpdateTime: DateTimeString;
}
