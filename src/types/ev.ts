// EV charging types, transcribed from the TDX 綠色運輸-充電樁 v1 OpenAPI spec
// (PTX.Model.EV.POCO.*). Every endpoint wraps its items in an object. Where live data
// contradicts the spec, the type follows the data and says so; the counts in comments come from
// checking every city and the freeway on 2026-10-21.
//
// The ID fields marked "not in the spec" exist in responses but not in TDX's query model, so
// they cannot be used in $filter, $select or $orderby (TDX answers 400). Join on them in code.
import type { DateTimeString, OpenString, WrapperHeader } from './common.js';

/** Charging station name (EVName). */
export interface EvName {
  Zh_tw: string;
  En?: string | null;
}

/** `City` path values accepted by the EV endpoints. */
export type EvCity = OpenString<
  | 'Taipei'
  | 'NewTaipei'
  | 'Taoyuan'
  | 'Taichung'
  | 'Tainan'
  | 'Kaohsiung'
  | 'Keelung'
  | 'Hsinchu'
  | 'HsinchuCounty'
  | 'MiaoliCounty'
  | 'ChanghuaCounty'
  | 'NantouCounty'
  | 'YunlinCounty'
  | 'ChiayiCounty'
  | 'Chiayi'
  | 'PingtungCounty'
  | 'YilanCounty'
  | 'HualienCounty'
  | 'TaitungCounty'
  | 'KinmenCounty'
  | 'PenghuCounty'
>;

/**
 * 充電槍規格 (connector type): 1 = CCS1, 2 = CCS2 (spelled "CCCS2" in the spec), 3 = CHAdeMO,
 * 4 = Tesla TPC, 5 = J1772 (Type 1), 6 = Mennekes (Type 2), 254 = other, 255 = unknown.
 */
export type EvConnectorType = 1 | 2 | 3 | 4 | 5 | 6 | 254 | 255;

/** 充電電力輸出方式: 1 = AC, 2 = DC. */
export type EvPower = 1 | 2;

/** 充電槍狀態: 1 = 可使用_閒置 (free), 2 = 佔用或充電中 (in use), 3 = 異常故障 (out of order). */
export type EvConnectorStatus = 1 | 2 | 3;

/** 營運種類: 1 = 公辦民營 (public, privately run), 2 = 公辦公營 (public), 3 = 私有民營 (private). */
export type EvOperationType = 1 | 2 | 3;

/** 費率類型: 1 = 免費 (free), 2 = 計度 (per kWh), 3 = 計分 (per minute), 4 = 計時 (per hour). */
export type EvRateType = 1 | 2 | 3 | 4;

/**
 * 定價類型: 1 = 固定費率 (flat), 2 = 尖離峰定價 (peak/off-peak), 3 = 平假日定價 (weekday/holiday),
 * 4 = 累進費率 (progressive), 5 = 分級定價 (tiered).
 */
export type EvPricingType = 1 | 2 | 3 | 4 | 5;

/**
 * 服務日類型: 1 = 每日 (every day), 2 = 平日 (weekdays), 3 = 假日 (weekends), 4 = 假日含國定例假日
 * (weekends and public holidays), 5 = 特殊平日, 6 = 特殊假日, 7 = 特殊假日含國定例假日, 8 = 其它 (other).
 */
export type EvDayType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** 尖離峰: 0 = 不分時段 (all day), 1 = 尖峰 (peak), 2 = 離峰 (off-peak), 3 = 半尖峰 (mid-peak). */
export type EvPeak = 0 | 1 | 2 | 3;

/** Header fields shared by every EV wrapper. */
export type EvWrapperHeader = WrapperHeader;

/** Connectors of one kind at a station (StationConnector). */
export interface EvStationConnector {
  Type: EvConnectorType;
  Power: EvPower;
  Quantity: number;
}

/** Freeway location (Freeway). */
export interface EvFreewayLocation {
  /** Freeway, e.g. `國道1號`. */
  Road: string;
  /** Service area, e.g. `泰安服務區`. */
  ServiceArea: string;
}

/** City road location (CityRoad). */
export interface EvCityRoadLocation {
  City: string;
  Town: string;
  Road: string;
}

/** Landmark location (Place). */
export interface EvPlaceLocation {
  /** Point of interest. */
  POI: string;
}

/** Street address (Address). */
export interface EvAddress {
  City: string;
  Town: string;
  Road: string;
  Lane?: string | null;
  Alley?: string | null;
  /** House number. Required by the spec; missing for 3 stations. */
  No?: string;
}

/** Where a station is (Location); one of the fields is usually set. */
export interface EvLocation {
  Freeway?: EvFreewayLocation | null;
  CityRoad?: EvCityRoadLocation | null;
  Place?: EvPlaceLocation | null;
  Address?: EvAddress | null;
}

/** Car park the station is in (Reference.CarPark); see `tdx.parking.carParks`. */
export interface EvCarParkReference {
  CarParkID: string;
}

/** On-street segment the station is on (Reference.CurbParkingSegment); see `tdx.parking.segments`. */
export interface EvParkingSegmentReference {
  ParkingSegmentID: string;
}

/** Related parking records (Reference). */
export interface EvReference {
  CarPark?: EvCarParkReference | null;
  CurbParkingSegment?: EvParkingSegmentReference | null;
}

/** Charging station (Station). */
export interface EvStation {
  /** Station ID; the format varies by operator. Present in live data but not in the spec (so not usable in OData). */
  StationID: string;
  StationName: EvName;
  Description: string;
  OperatorID: string;
  OperationType: EvOperationType;
  PositionLat: number;
  PositionLon: number;
  /** Station outline (WKT). */
  Geometry?: string | null;
  /** Number of charging parking spaces. */
  Spaces: number;
  /** Number of charging points. */
  ChargingPoints: number;
  /** Connector counts by type and power. */
  Connectors: EvStationConnector[];
  /** Opening hours as text, e.g. `每日/00:00-24:00`. Required by the spec; missing for 1 station. */
  ServiceTime?: string;
  /** Parking fee as text, e.g. `每1小時20元`. Required by the spec; missing for 1 station. */
  ParkingRate?: string;
  /** Charging fee as text, e.g. `計時/每日/10元每1時`. */
  ChargingRate: string;
  /** Floor(s), e.g. `B1`. */
  Floors: string;
  UsageRestriction?: string | null;
  PhotoURLs?: string[] | null;
  Location: EvLocation;
  Telephone: string;
  Reference?: EvReference | null;
}

/** Stations — `GET /v1/EV/Station/City/{City}` and `/v1/EV/Station/Freeway/ServiceArea`. */
export interface EvStations extends EvWrapperHeader {
  Stations: EvStation[];
}

/** Connectors of one type on a charging point (ChargingPointConnector). */
export interface EvChargingPointConnector {
  Type: EvConnectorType;
  Quantity: number;
}

/** Accepted payment methods (Payment). */
export interface EvPayment {
  CreditCard: boolean;
  /** Smart card (EasyCard, iPASS, …). */
  SmartCard: boolean;
  /** Mobile payment. */
  EPay: boolean;
  Others: boolean;
}

/** How charging is started (StartType). */
export interface EvStartType {
  ByCard: boolean;
  ByApp: boolean;
  ByStaff: boolean;
  Others: boolean;
}

/** Charging point (ChargingPoint). */
export interface EvChargingPoint {
  StationID: string;
  /** Charging point ID. Present in live data but not in the spec (so not usable in OData). */
  ChargingPointID: string;
  OperatorID: string;
  Connectors: EvChargingPointConnector[] | null;
  /** Charging fee as text. Required by the spec; missing for 2 charging points. */
  ChargingRate?: string;
  Payment: EvPayment;
  StartType: EvStartType;
  OperationURL?: string | null;
  /** Floor. Required by the spec; missing for 2 charging points. */
  Floor?: string;
  UsageRestriction?: string | null;
}

/** Charging points — `GET /v1/EV/ChargingPoint/City/{City}` and `…/Freeway/ServiceArea`. */
export interface EvChargingPoints extends EvWrapperHeader {
  ChargingPoints: EvChargingPoint[];
}

/** Connector (Connector). */
export interface EvConnector {
  StationID: string;
  ChargingPointID: string;
  /** Connector ID; joins to live status and rates. Present in live data but not in the spec (so not usable in OData). */
  ConnectorID: string;
  Type: EvConnectorType;
  Power: EvPower;
  /** Voltage as text, e.g. `220V`. */
  Voltage?: string | null;
  /** Current as text, e.g. `32A`. */
  CurrentRating?: string | null;
  /** Maximum power as text, e.g. `7KW`. */
  PowerRating: string;
  Floor: string;
  UsageRestriction?: string | null;
  /** Deep link into the operator's iOS app. */
  iOSURL?: string | null;
  /** Deep link into the operator's Android app. */
  AndroidURL?: string | null;
  /** Deep link into the operator's website. */
  WebURL?: string | null;
}

/** Connectors — `GET /v1/EV/Connector/City/{City}` and `…/Freeway/ServiceArea`. */
export interface EvConnectors extends EvWrapperHeader {
  Connectors: EvConnector[];
}

/** Live status of a connector (LiveStatus). */
export interface EvLiveStatus {
  StationID: string;
  ChargingPointID: string;
  /** Connector ID. Present in live data but not in the spec (so not usable in OData). */
  ConnectorID: string;
  ConnectorType: EvConnectorType;
  ConnectorStatus: EvConnectorStatus;
  /** Energy delivered in the current session (kWh). */
  ChargedKWH?: number | null;
  /** Battery level of the car being charged (%). */
  ChargedPercent?: number | null;
  LastUpdateTime: DateTimeString;
}

/** Live connector statuses — `GET /v1/EV/ConnectorLiveStatus/City/{City}` and `…/Freeway/ServiceArea`. */
export interface EvLiveStatuses extends EvWrapperHeader {
  LiveStatuses: EvLiveStatus[];
}

/** One charging price (ChargingRateDetail). */
export interface EvChargingRateDetail {
  /** Start of the period (HH:mm). */
  StartTime: string;
  /** End of the period (HH:mm; `24:00` = end of day). */
  EndTime: string;
  RateType: EvRateType;
  PricingType: EvPricingType;
  DayType?: EvDayType | null;
  DayInfo?: string | null;
  RateSequence?: number | null;
  /** Start of the stay band (minutes). */
  StayStart?: number | null;
  /** End of the stay band (minutes). */
  StayEnd?: number | null;
  /** Start of the power band (kW). */
  StartKW?: number | null;
  /** End of the power band (kW). */
  EndKW?: number | null;
  /** Price in NT$ per unit of `RateType`. */
  RatePrice: number;
  Peak: EvPeak;
  /** Whether this is a summer (electricity) rate. */
  Summer?: boolean | null;
}

/** Charging prices of a connector (ChargingRate). */
export interface EvChargingRate {
  StationID: string;
  ChargingPointID: string;
  /** Connector ID. Present in live data but not in the spec (so not usable in OData). */
  ConnectorID: string;
  Rates: EvChargingRateDetail[];
  /** Fee for staying after charging, as text. */
  OvertimeRate?: string | null;
}

/** Charging prices — `GET /v1/EV/ChargingRate/City/{City}` and `…/Freeway/ServiceArea`. */
export interface EvChargingRates extends EvWrapperHeader {
  ChargingRates: EvChargingRate[];
}
