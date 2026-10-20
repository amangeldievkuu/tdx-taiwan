// Bus types, transcribed from the TDX 公共運輸-公車 v2 OpenAPI spec
// (PTX.Service.DTO.Bus.Specification.V2.*).
import type { DateTimeString, NameType, OpenString, PointType } from './common.js';

/** `City` path values accepted by the city bus endpoints. */
export type BusCity = OpenString<
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

/** 公車路線類別: 11 = 市區公車 city bus, 12 = 公路客運 highway, 13 = 國道客運 freeway, 14 = 接駁車 shuttle. */
export type BusRouteType = 11 | 12 | 13 | 14;

/** 去返程: 0 = 去程 outbound, 1 = 返程 inbound, 2 = 迴圈 loop, 10 = 循環線 circular, 255 = 未知 unknown. */
export type BusDirection = 0 | 1 | 2 | 10 | 255;

/** 車輛狀態: 0 = 正常, 1 = 尚未發車 not departed, 2 = 交管不停靠 not stopping, 3 = 末班車已過 last bus passed, 4 = 今日未營運 not operating today. */
export type BusStopStatus = 0 | 1 | 2 | 3 | 4;

/** 資料型態: 0 = 未知 unknown, 1 = 定期 scheduled, 2 = 非定期 unscheduled. */
export type BusMessageType = 0 | 1 | 2;

/** 上下車站別: -1 = 可下車 alight only, 0 = 可上下車 board & alight, 1 = 可上車 board only. */
export type BusStopBoarding = -1 | 0 | 1;

/** 進離站: 0 = 離站 departing, 1 = 進站 arriving. */
export type VehicleStopStatus = 0 | 1;

/** Route operator (Embedded.RouteOperator). */
export interface RouteOperator {
  OperatorID: string;
  OperatorName: NameType;
  OperatorCode?: string | null;
  /** Operator number as defined by the MOTC ticketing system. */
  OperatorNo: string;
}

/** Sub-route (BusSubRoute). */
export interface BusSubRoute {
  /** Unique sub-route ID: {AuthorityCode} + {SubRouteID}. */
  SubRouteUID: string;
  SubRouteID: string;
  OperatorIDs: string[];
  SubRouteName: NameType;
  /** Headsign (車頭描述). */
  Headsign?: string | null;
  HeadsignEn?: string | null;
  Direction: BusDirection;
  /** First departure on weekdays (HH:mm). */
  FirstBusTime?: string | null;
  /** Spec description: 平日返程第一班發車時間. */
  LastBusTime?: string | null;
  /** First departure on holidays (HH:mm). */
  HolidayFirstBusTime?: string | null;
  /** Spec description: 假日返程第一班發車時間. */
  HolidayLastBusTime?: string | null;
  DepartureStopNameZh?: string | null;
  DepartureStopNameEn?: string | null;
  DestinationStopNameZh?: string | null;
  DestinationStopNameEn?: string | null;
}

/** Bus route (BusRoute) — `GET /v2/Bus/Route/City/{City}[/{RouteName}]`. */
export interface BusRoute {
  /** Unique route ID: {AuthorityCode} + {RouteID}. */
  RouteUID: string;
  RouteID: string;
  /** Whether the route actually has multiple sub-routes. */
  HasSubRoutes: boolean;
  Operators: RouteOperator[];
  AuthorityID: string;
  ProviderID: string;
  SubRoutes?: BusSubRoute[] | null;
  BusRouteType: BusRouteType;
  RouteName: NameType;
  DepartureStopNameZh?: string | null;
  DepartureStopNameEn?: string | null;
  DestinationStopNameZh?: string | null;
  DestinationStopNameEn?: string | null;
  TicketPriceDescriptionZh?: string | null;
  TicketPriceDescriptionEn?: string | null;
  FareBufferZoneDescriptionZh?: string | null;
  FareBufferZoneDescriptionEn?: string | null;
  RouteMapImageUrl?: string | null;
  /** Owning city (empty for highway/freeway routes). */
  City?: string | null;
  /** ISO 3166-2 three-letter city code. */
  CityCode?: string | null;
  UpdateTime: DateTimeString;
  VersionID: number;
}

/** Stop on a route (Embedded.Stop). */
export interface BusStop {
  /** Unique stop ID: {AuthorityCode} + {StopID}. */
  StopUID: string;
  StopID: string;
  StopName: NameType;
  StopBoarding?: BusStopBoarding | null;
  /** Order of the stop along the route. */
  StopSequence: number;
  StopPosition: PointType;
  StationID?: string | null;
  StationGroupID: string;
  LocationCityCode?: string | null;
}

/** Stops of a (sub-)route (BusStopOfRoute) — `GET /v2/Bus/StopOfRoute/City/{City}/{RouteName}`. */
export interface BusStopOfRoute {
  RouteUID: string;
  RouteID: string;
  RouteName: NameType;
  Operators?: RouteOperator[] | null;
  SubRouteUID: string;
  SubRouteID: string;
  SubRouteName: NameType;
  Direction?: BusDirection | null;
  City?: string | null;
  CityCode?: string | null;
  Stops: BusStop[];
  UpdateTime: DateTimeString;
  VersionID: number;
}

/** Per-vehicle estimate (N1.Estimate). */
export interface BusEstimate {
  PlateNumb?: string | null;
  /** Estimated seconds until arrival. */
  EstimateTime?: number | null;
  IsLastBus?: boolean | null;
  VehicleStopStatus?: VehicleStopStatus | null;
}

/**
 * Estimated time of arrival (BusN1EstimateTime) —
 * `GET /v2/Bus/EstimatedTimeOfArrival/City/{City}/{RouteName}`.
 */
export interface BusEstimatedTimeOfArrival {
  /** Plate number; `-1` means no vehicle is currently serving this stop. */
  PlateNumb?: string | null;
  StopUID?: string | null;
  StopID?: string | null;
  StopName?: NameType | null;
  RouteUID?: string | null;
  RouteID?: string | null;
  RouteName?: NameType | null;
  SubRouteUID?: string | null;
  SubRouteID?: string | null;
  SubRouteName?: NameType | null;
  /** Direction of the vehicle's current trip (not of the stop). */
  Direction: BusDirection;
  /**
   * Estimated seconds until arrival. `null` when `StopStatus` is 2–4 or `PlateNumb` is `-1`.
   * When `StopStatus` is 1, some cities give the time until departure instead.
   */
  EstimateTime?: number | null;
  /** Scheduled time (HH:mm). */
  ScheduledTime?: string | null;
  /** Number of stops between the vehicle and this stop. */
  StopCountDown?: number | null;
  CurrentStop?: string | null;
  DestinationStop?: string | null;
  StopSequence?: number | null;
  StopStatus?: BusStopStatus | null;
  MessageType?: BusMessageType | null;
  /** Next bus arrival time. */
  NextBusTime?: DateTimeString | null;
  IsLastBus?: boolean | null;
  Estimates?: BusEstimate[] | null;
  /** When the estimate was computed (only provided by some sources). */
  DataTime?: DateTimeString | null;
  TransTime?: DateTimeString | null;
  SrcRecTime?: DateTimeString | null;
  SrcTransTime?: DateTimeString | null;
  SrcUpdateTime?: DateTimeString | null;
  /** TDX update time. */
  UpdateTime: DateTimeString;
}

/** 勤務狀態: 0 = 正常 normal, 1 = 開始 start of duty, 2 = 結束 end of duty. */
export type BusDutyStatus = 0 | 1 | 2;

/**
 * 行車狀況 (the vehicle's `BusStatus`): 0 = 正常 normal, 1 = 車禍 accident, 2 = 故障 breakdown,
 * 3 = 塞車 congestion, 4 = 緊急求援 emergency, 5 = 加油 refuelling, 90 = 不明 unknown,
 * 91 = 去回不明 direction unknown, 98 = 偏移路線 off route, 99 = 非營運狀態 not in service.
 */
export type BusVehicleStatus = 0 | 1 | 2 | 3 | 4 | 5 | 90 | 91 | 98 | 99;

/**
 * Stop of a city (V2.BusStop) — `GET /v2/Bus/Stop/City/{City}`. Not to be confused with
 * {@link BusStop}, the stop embedded in `BusStopOfRoute`.
 */
export interface BusStopInfo {
  /** Unique stop ID: {AuthorityCode} + {StopID}. */
  StopUID: string;
  StopID: string;
  AuthorityID: string;
  StopName: NameType;
  StopPosition: PointType;
  StopAddress?: string | null;
  /** Direction of travel at the stop: E, W, S, N, SE, NE, SW or NW. */
  Bearing?: string | null;
  StationID?: string | null;
  /** Station group ID. Required by the spec, but missing for Taipei and Kaohsiung stops. */
  StationGroupID?: string;
  StopDescription?: string | null;
  /** City that manages the stop (the `City` path value); empty for highway routes. */
  City?: string | null;
  /** ISO 3166-2 code of the managing city, e.g. `TPE`. */
  CityCode?: string | null;
  /** ISO 3166-2 code of the city the stop is located in. */
  LocationCityCode?: string | null;
  /** TDX update time. */
  UpdateTime: DateTimeString;
  VersionID: number;
}

/**
 * Live vehicle position, reported at regular intervals (BusA1Data) —
 * `GET /v2/Bus/RealTimeByFrequency/City/{City}/{RouteName}` and `…/InterCity/{RouteName}`.
 */
export interface BusPosition {
  /** Plate number. */
  PlateNumb: string;
  OperatorID?: string | null;
  /** Operator number (MOTC ticketing system). */
  OperatorNo?: string | null;
  RouteUID?: string | null;
  RouteID?: string | null;
  RouteName?: NameType | null;
  SubRouteUID?: string | null;
  SubRouteID?: string | null;
  SubRouteName?: NameType | null;
  Direction?: BusDirection | null;
  BusPosition?: PointType | null;
  /** Speed in km/h. */
  Speed?: number | null;
  /** Heading in degrees. */
  Azimuth?: number | null;
  DutyStatus?: BusDutyStatus | null;
  BusStatus?: BusVehicleStatus | null;
  MessageType?: BusMessageType | null;
  /** Time on the vehicle's GPS unit. */
  GPSTime: DateTimeString;
  TransTime?: DateTimeString | null;
  SrcRecTime?: DateTimeString | null;
  SrcTransTime?: DateTimeString | null;
  SrcUpdateTime?: DateTimeString | null;
  /** TDX update time. */
  UpdateTime: DateTimeString;
}
