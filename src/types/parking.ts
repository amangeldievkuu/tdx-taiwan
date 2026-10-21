// Parking types, transcribed from the TDX 停車資訊 v1 OpenAPI spec
// (PTX.Service.DTO.Parking.Specification.V1.*). Every endpoint wraps its items in an object.
// Where live data contradicts the spec, the type follows the data and says so; the counts in
// comments come from checking every city on 2026-10-21.
import type { DateTimeString, Flag, OpenString, PointType } from './common.js';

/** Multilingual name used by the Parking API (V3 Base NameType). Live data often has `{}`. */
export interface ParkingNameType {
  Zh_tw?: string | null;
  En?: string | null;
}

/**
 * `City` path values across the Parking endpoints. Coverage differs per endpoint: car parks
 * exist for 21 cities but not NewTaipei, availability for 12, on-street segments for 11
 * (including NewTaipei) and segment availability for 9. Cities without data return an empty list.
 */
export type ParkingCity = OpenString<
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
  | 'LienchiangCounty'
>;

/** A yes/no flag: 0 = 否 (no), 1 = 是 (yes). */
export type ParkingFlag = Flag;

/**
 * 停車場類型: 1 = 平面 (surface), 2 = 立體 (multi-storey), 3 = 地下 (underground),
 * 4 = 立體停車塔 (tower), 5 = 立體機械式 (mechanical), 6 = 同時涵蓋2種以上 (mixed),
 * 254 = 其他 (other), 255 = 未知 (unknown).
 */
export type ParkingCarParkType = 1 | 2 | 3 | 4 | 5 | 6 | 254 | 255;

/**
 * 停車導引類型: 1 = 自行找尋 (self), 2 = 導引輔助設施 (guidance system), 3 = 人工導引 (attendant),
 * 4 = 代客泊車 (valet), 5 = 混合型 (mixed), 254 = 其他, 255 = 未知.
 */
export type ParkingGuideType = 1 | 2 | 3 | 4 | 5 | 254 | 255;

/** 收費方式: 1 = 計時 (hourly), 2 = 計次 (per entry), 3 = 月租 (monthly), 4 = 免費 (free), 254 = 其他, 255 = 未知. */
export type ParkingChargeType = 1 | 2 | 3 | 4 | 254 | 255;

/** 營運種類: 1 = 公辦民營 (public, privately run), 2 = 公辦公營 (public), 3 = 私有民營 (private). */
export type ParkingOperationType = 1 | 2 | 3;

/** 監視系統類型: 1 = CCTV, 2 = CCTV and IVA, 254 = 其他, 255 = 未知. */
export type ParkingSupervisionType = 1 | 2 | 254 | 255;

/**
 * 停車位類型: 0 = 所有 (all), 1 = 自小客車 (car), 2 = 機車 (scooter), 3 = 重型機車 (heavy motorcycle),
 * 4 = 腳踏車 (bicycle), 5 = 大型車 (large vehicle), 6 = 小型巴士 (minibus), 7 = 孕婦及親子 (family),
 * 8 = 婦女 (women), 9 = 身心障礙汽車 (disabled, car), 10 = 身心障礙機車 (disabled, scooter),
 * 11 = 電動汽車 (EV), 12 = 電動機車 (e-scooter), 13 = 復康巴士 (rehabilitation bus),
 * 14–23 = 月租/季租/半年租/年租/租賃 (monthly, seasonal, half-year, yearly and rental spaces for
 * scooters and cars), 24 = 卸貨 (loading), 25 = 計程車 (taxi), 26 = 夜間安心 (night safety),
 * 27 = 臨時停車 (short stay), 28 = 專用 (reserved), 29 = 預約 (bookable), 254 = 其他, 255 = 未知.
 */
export type ParkingSpaceType =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 254
  | 255;

/** 營業狀態: 0 = 休息中 (closed), 1 = 營業中 (open), 2 = 暫停營業 (suspended), 3 = 非營業時段 (outside hours). */
export type ParkingServiceStatus = 0 | 1 | 2 | 3;

/** 格位狀態: 0 = 尚有空位 (spaces free), 1 = 車位將滿 (almost full), 2 = 車位已滿 (full), 3 = 過度擁擠 (overcrowded). */
export type ParkingFullStatus = 0 | 1 | 2 | 3;

/** 收費狀態: 0 = 不收費 (free), 1 = 正常收費 (charging), 2 = 暫停收費 (suspended), 3 = 非收費時段 (outside charging hours). */
export type ParkingChargeStatus = 0 | 1 | 2 | 3;

/**
 * Header fields shared by every Parking wrapper. When a city has no data, TDX returns only
 * `UpdateInterval` and `SrcUpdateInterval` (both `-1`), so the other fields are optional.
 */
export interface ParkingWrapperHeader {
  /** TDX update time. Required by the spec, but missing when the city has no data. */
  UpdateTime?: DateTimeString;
  /** TDX update interval in seconds; `-1` when the city has no data. */
  UpdateInterval: number;
  /** Source update time. Required by the spec, but missing for car parks in 12 cities. */
  SrcUpdateTime?: DateTimeString;
  /** Source update interval in seconds. Required by the spec, but missing like `SrcUpdateTime`. */
  SrcUpdateInterval?: number;
  /** Authority code, e.g. `TPE`. Required by the spec, but missing when the city has no data. */
  AuthorityCode?: string;
  Count?: number | null;
}

/** An area within a car park (ParkingArea). */
export interface ParkingArea {
  ParkingAreaID: string;
  ParkingAreaName: ParkingNameType;
  /** Parking type codes (see {@link ParkingCarPark.ParkingTypes}). */
  ParkingTypes: number[];
  /** Area outline (WKT). */
  Geometry?: string | null;
}

/** Off-street car park (CarPark). */
export interface ParkingCarPark {
  CarParkID: string;
  CarParkName: ParkingNameType;
  CarParkShortName?: ParkingNameType | null;
  /** Registration number. Required by the spec, but missing for 2,618 of 3,789 car parks. */
  CarParkRegNo?: string;
  OperatorID: string;
  /** Car park outline (WKT). */
  Geometry?: string | null;
  Description: string;
  CarParkType: ParkingCarParkType;
  ParkingGuideType: ParkingGuideType;
  ParkingAreas?: ParkingArea[] | null;
  /**
   * 停車類型: 1 停車轉乘公共運輸 (park and ride), 2 臨時停車接送 (drop-off), 3 轉乘公共自行車 (park and
   * bike), 4 停車後步行 (park and walk), 5 活動專用 (events), 6 休息站 (rest stop), 7 服務區 (service
   * area), 8 貨車及大型車 (trucks), 9 共享汽車 (car sharing), 10 共乘 (carpool), 254 其他, 255 未知.
   */
  ParkingTypes: number[];
  /**
   * 服務類型: 1 軌道場站 (rail station), 2 機場 (airport), 3 船舶 (port), 4 商圈 (shopping district),
   * 5 餐廳, 6 運動場, 7 飯店, 8 觀光地標, 9 電影院, 10 觀光景點, 11 學校, 12 美術博物館, 13 展覽中心,
   * 14 會議中心, 15 宗教機構, 16 賣場, 17 動物園, 18 高速公路, 19 政府部門, 20 住宅區, 21 夜市, 22 市場,
   * 23 公園, 254 其他, 255 未知.
   */
  ParkingSiteTypes: number[];
  /** Charging methods. Required by the spec, but missing for 6 car parks. */
  ChargeTypes?: ParkingChargeType[];
  /** Phone. Required by the spec, but missing for most car parks (Taipei, Taichung, Kaohsiung…). */
  Telephone?: string;
  EmergencyPhone?: string | null;
  CarParkPosition: PointType;
  /** Email. Required by the spec, but missing for most car parks. */
  Email?: string;
  Address: string;
  ImageURLs?: string[] | null;
  WebURL?: string | null;
  FareURL?: string | null;
  FareDescription: string;
  SpecialOfferDescription?: string | null;
  IsFreeParkingOutOfHours: ParkingFlag;
  VehicleRestriction?: string | null;
  IsPublic: ParkingFlag;
  IsMotorcycle?: ParkingFlag;
  OperationType: ParkingOperationType;
  /** Whether live availability is published (see `parking.availability`). */
  LiveOccuppancyAvailable: ParkingFlag;
  EVRechargingAvailable: ParkingFlag;
  MonthlyTicketAvailable: ParkingFlag;
  SeasonTicketAvailable: ParkingFlag;
  ReservationAvailable: ParkingFlag;
  ReservationURL?: string | null;
  ReservationDescription?: string | null;
  WheelchairAccessible: ParkingFlag;
  OvernightPermitted: ParkingFlag;
  TicketMachine: ParkingFlag;
  Toilet: ParkingFlag;
  Restaurant: ParkingFlag;
  GasStation: ParkingFlag;
  Shop: ParkingFlag;
  Gated: ParkingFlag;
  Lighting: ParkingFlag;
  SecureParking: ParkingFlag;
  TicketOffice: ParkingFlag;
  /** Whether loading or unloading hazardous materials is allowed. */
  ProhibitedForAnyHazardousMaterialLoads: ParkingFlag;
  SecurityGuard: ParkingFlag;
  Supervision: ParkingFlag;
  SupervisionType?: ParkingSupervisionType | null;
  LandMark?: string | null;
  BuildingName?: string | null;
  LocationMapURL?: string | null;
  /** City (English), e.g. `Taipei`. */
  City: string;
  CityCode: string;
  /** District name. Required by the spec, but missing for every car park. */
  TownName?: string;
  /** District code. Required by the spec, but missing for every car park. */
  TownID?: string;
}

/**
 * Off-street car parks of a city — `GET /v1/Parking/OffStreet/CarPark/City/{City}`. The spec
 * calls the array `Items`; live responses use `CarParks`.
 */
export interface ParkingCarParks extends ParkingWrapperHeader {
  VersionID: number;
  CarParks: ParkingCarPark[];
}

/** Spaces of one type in a car park (Availability). */
export interface ParkingSpaceAvailability {
  SpaceType: ParkingSpaceType;
  NumberOfSpaces: number;
  AvailableSpaces: number;
}

/** Spaces of one type in one area of a car park (AreaAvailability). */
export interface ParkingAreaAvailability {
  ParkingAreaID: string;
  SpaceType: ParkingSpaceType;
  NumberOfSpaces: number;
  AvailableSpaces: number;
}

/** Live availability of a car park (ParkingAvailability). Join to car parks on `CarParkID`. */
export interface ParkingAvailability {
  CarParkID: string;
  CarParkName: ParkingNameType;
  TotalSpaces: number;
  AvailableSpaces: number;
  /** Per space type, e.g. cars (`1`) and scooters (`2`). */
  Availabilities?: ParkingSpaceAvailability[] | null;
  AreaAvailabilities?: ParkingAreaAvailability[] | null;
  ServiceStatus: ParkingServiceStatus;
  FullStatus: ParkingFullStatus;
  /** Threshold for "spaces free" (cars). */
  ServiceAvailableLevel?: string | null;
  /** Threshold for "almost full" (cars). */
  AlmostFullLevel?: string | null;
  /** Threshold for "full" (cars). */
  FullLevel?: string | null;
  /** Threshold for "overcrowded" (cars). */
  OverCrowdingLevel?: string | null;
  ChargeStatus: ParkingChargeStatus;
  Remark?: string | null;
  /** When the source produced the data. */
  DataCollectTime: DateTimeString;
}

/**
 * Live car park availability of a city — `GET /v1/Parking/OffStreet/ParkingAvailability/City/{City}`.
 * The spec calls the array `Items`; live responses use `ParkingAvailabilities`.
 */
export interface ParkingAvailabilities extends ParkingWrapperHeader {
  ParkingAvailabilities: ParkingAvailability[];
}

/** The roads bounding a segment (RoadType). */
export interface ParkingRoadSection {
  /** Start road. Required by the spec, but missing for 2,716 of 6,489 segments. */
  Start?: string;
  /** End road. Required by the spec, but missing for 2,724 of 6,489 segments. */
  End?: string;
}

/** Road reference (Road). */
export interface ParkingRoad {
  RoadID?: string | null;
}

/** Road link reference (Link). */
export interface ParkingLink {
  LinkID?: string | null;
}

/** On-street parking segment (ParkingSegment). */
export interface ParkingSegment {
  ParkingSegmentID: string;
  ParkingSegmentName: ParkingNameType;
  RoadSection?: ParkingRoadSection | null;
  ParkingSegmentPosition: PointType;
  /** Segment outline (WKT, e.g. `POLYGON ((…))`). */
  Geometry?: string | null;
  Description: string;
  /** Fare text, e.g. `40元(09:00-17:00)`. */
  FareDescription: string;
  HasChargingPoint?: ParkingFlag;
  ImageURLs?: string[] | null;
  City: string;
  CityCode: string;
  /** District name. Required by the spec, but missing for every segment. */
  TownName?: string;
  /** District code. Required by the spec, but missing for every segment. */
  TownID?: string;
  LandMark?: string | null;
  Roads?: ParkingRoad[] | null;
  Links?: ParkingLink[] | null;
}

/**
 * On-street parking segments of a city — `GET /v1/Parking/OnStreet/ParkingSegment/City/{City}`.
 * The spec calls the array `Items`; live responses use `ParkingSegments`.
 */
export interface ParkingSegments extends ParkingWrapperHeader {
  VersionID: number;
  ParkingSegments: ParkingSegment[];
}

/** Spaces of one type in a segment (SegmentAvailability). */
export interface ParkingSegmentSpaceAvailability {
  SpaceType: ParkingSpaceType;
  NumberOfSpaces: number;
  AvailableSpaces: number;
  /** Occupancy ratio as a string, e.g. `"0.56"`. */
  Occupancy?: string | null;
}

/** Live availability of an on-street segment (CurbParkingSegmentAvailability). */
export interface ParkingSegmentAvailability {
  ParkingSegmentID: string;
  ParkingSegmentName: ParkingNameType;
  TotalSpaces: number;
  AvailableSpaces: number;
  Availabilities: ParkingSegmentSpaceAvailability[];
  ServiceStatus: ParkingServiceStatus;
  FullStatus: ParkingFullStatus;
  ServiceAvailableLevel?: string | null;
  AlmostFullLevel?: string | null;
  FullLevel?: string | null;
  OverCrowdingLevel?: string | null;
  ChargeStatus: ParkingChargeStatus;
  Remark?: string | null;
  /** When the source produced the data. */
  DataCollectTime: DateTimeString;
}

/**
 * Live on-street availability of a city —
 * `GET /v1/Parking/OnStreet/ParkingSegmentAvailability/City/{City}`. The spec calls the array
 * `Items`; live responses use `CurbParkingSegmentAvailabilities`.
 */
export interface ParkingSegmentAvailabilities extends ParkingWrapperHeader {
  CurbParkingSegmentAvailabilities: ParkingSegmentAvailability[];
}
