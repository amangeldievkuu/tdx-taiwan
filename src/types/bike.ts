// Bike types, transcribed from the TDX 公共運輸-自行車 v2 OpenAPI spec
// (PTX.Service.DTO.Bike.Specification.V2.*).
import type { DateTimeString, NameType, OpenString, PointType } from './common.js';

/** `City` path values accepted by the Bike endpoints. */
export type BikeCity = OpenString<
  | 'Taipei'
  | 'NewTaipei'
  | 'Taoyuan'
  | 'Taichung'
  | 'Tainan'
  | 'Kaohsiung'
  | 'Hsinchu'
  | 'HsinchuCounty'
  | 'MiaoliCounty'
  | 'ChanghuaCounty'
  | 'YunlinCounty'
  | 'Chiayi'
  | 'ChiayiCounty'
  | 'PingtungCounty'
  | 'TaitungCounty'
>;

/** 服務類型: 1 = YouBike1.0, 2 = YouBike2.0, 3 = Moovo. */
export type BikeServiceType = 1 | 2 | 3;

/** 服務狀態: 0 = 停止營運 (out of service), 1 = 正常營運 (operating), 2 = 暫停營運 (suspended). */
export type BikeServiceStatus = 0 | 1 | 2;

/** Rental station (BikeStation) — `GET /v2/Bike/Station/City/{City}`. */
export interface BikeStation {
  /** Unique station ID: {AuthorityCode} + {StationID}. */
  StationUID?: string | null;
  /** Station ID. */
  StationID?: string | null;
  /** Authority ID. */
  AuthorityID?: string | null;
  StationName?: NameType | null;
  StationPosition?: PointType | null;
  StationAddress?: NameType | null;
  /** Station description. */
  StopDescription?: string | null;
  /** Total number of docks. */
  BikesCapacity?: number | null;
  ServiceType?: BikeServiceType | null;
  /** Source platform update time. */
  SrcUpdateTime?: DateTimeString | null;
  /** TDX update time. */
  UpdateTime: DateTimeString;
}

/** Bikes available per type (AvailableRentBikesDetail). */
export interface AvailableRentBikesDetail {
  /** Regular bikes available to rent. */
  GeneralBikes?: number;
  /** E-bikes available to rent. */
  ElectricBikes?: number;
}

/** Real-time availability (BikeAvailability) — `GET /v2/Bike/Availability/City/{City}`. */
export interface BikeAvailability {
  /** Unique station ID: {AuthorityCode} + {StationID}. */
  StationUID?: string | null;
  /** Station ID. */
  StationID?: string | null;
  ServiceStatus?: BikeServiceStatus;
  ServiceType?: BikeServiceType | null;
  /** Bikes available to rent. */
  AvailableRentBikes?: number | null;
  /** Empty docks available for returning. */
  AvailableReturnBikes?: number | null;
  /** Source platform update time. */
  SrcUpdateTime?: DateTimeString | null;
  /** TDX update time. */
  UpdateTime: DateTimeString;
  AvailableRentBikesDetail?: AvailableRentBikesDetail | null;
}
