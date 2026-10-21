import type {
  ShipAlert,
  ShipAlerts,
  ShipAuthorities,
  ShipAuthority,
  ShipCity,
  ShipDailySchedule,
  ShipDailySchedules,
  ShipGeneralSchedule,
  ShipGeneralSchedules,
  ShipLiveBoard,
  ShipLiveBoards,
  ShipLivePosition,
  ShipLivePositions,
  ShipNews,
  ShipNewsList,
  ShipOperator,
  ShipOperators,
  ShipPort,
  ShipPortId,
  ShipPorts,
  ShipRoute,
  ShipRouteFare,
  ShipRouteFares,
  ShipRouteId,
  ShipRoutes,
  ShipSeatAvailabilities,
  ShipSeatAvailability,
  ShipStopOfRoute,
  ShipStopOfRoutes,
  ShipVessel,
  ShipVessels,
} from '../types/ship.js';
import {
  type ListRequester,
  type ObjectRequester,
  type QueryInput,
  optional,
  segment,
} from './requester.js';

const SHIP = '/v3/Ship';

/**
 * Ferry and ship (航運) endpoints: the nationwide feed of the 航港局 (MPB) covering outlying
 * islands, 小三通 and the few international lines, plus the county and city blue-highway
 * routes under `domestic`. Every response is a wrapper object whose array is named per kind
 * (`Ports`, `Routes`, `ShipLiveBoardses`, …); queries apply to the items inside it.
 */
export class ShipApi {
  /** County and city routes (`…/Domestic/City/{City}`), disjoint from the nationwide feed. */
  readonly domestic: ShipDomesticApi;

  constructor(
    private readonly list: ListRequester,
    private readonly object: ObjectRequester,
  ) {
    this.domestic = new ShipDomesticApi(object);
  }

  /** The 75 ports with positions. Cached with the static TTL. `GET /v3/Ship/Port` */
  ports(query?: QueryInput<ShipPort>): Promise<ShipPorts> {
    return this.object(`${SHIP}/Port`, query, 'static');
  }

  /**
   * The nationwide routes (40: outlying islands, cross-strait, 小三通). City blue-highway
   * routes are under `domestic`. Cached with the static TTL. `GET /v3/Ship/Route`
   */
  routes(query?: QueryInput<ShipRoute>): Promise<ShipRoutes> {
    return this.object(`${SHIP}/Route`, query, 'static');
  }

  /** Operators. Cached with the static TTL. `GET /v3/Ship/Operator` */
  operators(query?: QueryInput<ShipOperator>): Promise<ShipOperators> {
    return this.object(`${SHIP}/Operator`, query, 'static');
  }

  /** Vessels with tonnage, size and capacity. Cached with the static TTL. `GET /v3/Ship/Vessel` */
  vessels(query?: QueryInput<ShipVessel>): Promise<ShipVessels> {
    return this.object(`${SHIP}/Vessel`, query, 'static');
  }

  /**
   * Ordered ports of each route and direction.
   * Cached with the static TTL. `GET /v3/Ship/StopOfRoute`
   */
  stopsOfRoute(query?: QueryInput<ShipStopOfRoute>): Promise<ShipStopOfRoutes> {
    return this.object(`${SHIP}/StopOfRoute`, query, 'static');
  }

  /** Fares of every route (about 130 KB). Cached with the static TTL. `GET /v3/Ship/ODFare` */
  odFare(query?: QueryInput<ShipRouteFare>): Promise<ShipRouteFares> {
    return this.object(`${SHIP}/ODFare`, query, 'static');
  }

  /**
   * Fares between two ports, as a plain array (TDX's older endpoint shape). Cached with the
   * static TTL. `GET /v3/Ship/ODFare/{OriginPortID}/to/{DestinationPortID}`
   *
   * @example tdx.ship.odFareBetween('TWKEL', 'TW007') // Keelung → Nangan
   */
  odFareBetween(
    from: ShipPortId,
    to: ShipPortId,
    query?: QueryInput<ShipRouteFare>,
  ): Promise<ShipRouteFare[]> {
    const path = `${SHIP}/ODFare/${segment(from, 'from')}/to/${segment(to, 'to')}`;
    return this.list(path, query, 'static');
  }

  /**
   * Regular timetables, for one route or for all. Cached with the static TTL.
   * `GET /v3/Ship/GeneralSchedule[/{RouteID}]`
   */
  generalSchedule(query?: QueryInput<ShipGeneralSchedule>): Promise<ShipGeneralSchedules>;
  generalSchedule(
    routeId: ShipRouteId,
    query?: QueryInput<ShipGeneralSchedule>,
  ): Promise<ShipGeneralSchedules>;
  generalSchedule(
    routeIdOrQuery?: ShipRouteId | QueryInput<ShipGeneralSchedule>,
    query?: QueryInput<ShipGeneralSchedule>,
  ): Promise<ShipGeneralSchedules> {
    const base = `${SHIP}/GeneralSchedule`;
    return this.object(...optional(base, 'routeId', routeIdOrQuery, query), 'static');
  }

  /**
   * Day-by-day timetables for the coming weeks, for one route or for all. The full list is
   * about 850 rows and 1.3 MB, so pass a route. Cached with the static TTL.
   * `GET /v3/Ship/DailySchedule[/{RouteID}]`
   *
   * @example tdx.ship.dailySchedule('FGGI', { filter: "Date eq '2026-10-22'" })
   */
  dailySchedule(query?: QueryInput<ShipDailySchedule>): Promise<ShipDailySchedules>;
  dailySchedule(
    routeId: ShipRouteId,
    query?: QueryInput<ShipDailySchedule>,
  ): Promise<ShipDailySchedules>;
  dailySchedule(
    routeIdOrQuery?: ShipRouteId | QueryInput<ShipDailySchedule>,
    query?: QueryInput<ShipDailySchedule>,
  ): Promise<ShipDailySchedules> {
    const base = `${SHIP}/DailySchedule`;
    return this.object(...optional(base, 'routeId', routeIdOrQuery, query), 'static');
  }

  /**
   * Today's departure and arrival boards, one element per port (25 ports). The array is named
   * `ShipLiveBoardses`. Cached with the real-time TTL. `GET /v3/Ship/ShipLiveBoard`
   */
  liveBoard(query?: QueryInput<ShipLiveBoard>): Promise<ShipLiveBoards> {
    return this.object(`${SHIP}/ShipLiveBoard`, query, 'realtime');
  }

  /** AIS positions of the ferries. Cached with the real-time TTL. `GET /v3/Ship/LivePosition` */
  livePosition(query?: QueryInput<ShipLivePosition>): Promise<ShipLivePositions> {
    return this.object(`${SHIP}/LivePosition`, query, 'realtime');
  }

  /**
   * Seats left on today's sailings (live data covers the 金門–石井 小三通 line). Cached with
   * the real-time TTL. `GET /v3/Ship/SeatAvailability`
   */
  seatAvailability(query?: QueryInput<ShipSeatAvailability>): Promise<ShipSeatAvailabilities> {
    return this.object(`${SHIP}/SeatAvailability`, query, 'realtime');
  }

  /**
   * Service alerts (typhoon suspensions and the like).
   * Cached with the real-time TTL. `GET /v3/Ship/Alert`
   */
  alerts(query?: QueryInput<ShipAlert>): Promise<ShipAlerts> {
    return this.object(`${SHIP}/Alert`, query, 'realtime');
  }

  /** News. Empty in live data so far. Cached with the real-time TTL. `GET /v3/Ship/News` */
  news(query?: QueryInput<ShipNews>): Promise<ShipNewsList> {
    return this.object(`${SHIP}/News`, query, 'realtime');
  }

  /**
   * The 14 authorities behind `AuthorityCode`.
   * Cached with the static TTL. `GET /v3/Ship/Authority`
   */
  authorities(query?: QueryInput<ShipAuthority>): Promise<ShipAuthorities> {
    return this.object(`${SHIP}/Authority`, query, 'static');
  }
}

/**
 * Routes run by county and city governments (Penghu inter-island lines, Kaohsiung harbour
 * ferries, Tamsui and Taipei river routes, Kinmen 九宮–水頭). These do not appear in the
 * nationwide feed. See `ShipCity` for which cities each kind accepts.
 */
export class ShipDomesticApi {
  constructor(private readonly object: ObjectRequester) {}

  /**
   * Routes of a city or county.
   * Cached with the static TTL. `GET /v3/Ship/Route/Domestic/City/{City}`
   */
  routes(city: ShipCity, query?: QueryInput<ShipRoute>): Promise<ShipRoutes> {
    return this.object(`${SHIP}/Route/${cityOf(city)}`, query, 'static');
  }

  /**
   * Operators of a city.
   * Cached with the static TTL. `GET /v3/Ship/Operator/Domestic/City/{City}`
   */
  operators(city: ShipCity, query?: QueryInput<ShipOperator>): Promise<ShipOperators> {
    return this.object(`${SHIP}/Operator/${cityOf(city)}`, query, 'static');
  }

  /** Vessels of a city. Cached with the static TTL. `GET /v3/Ship/Vessel/Domestic/City/{City}` */
  vessels(city: ShipCity, query?: QueryInput<ShipVessel>): Promise<ShipVessels> {
    return this.object(`${SHIP}/Vessel/${cityOf(city)}`, query, 'static');
  }

  /**
   * Stop sequences of a city's routes.
   * Cached with the static TTL. `GET /v3/Ship/StopOfRoute/Domestic/City/{City}`
   */
  stopsOfRoute(city: ShipCity, query?: QueryInput<ShipStopOfRoute>): Promise<ShipStopOfRoutes> {
    return this.object(`${SHIP}/StopOfRoute/${cityOf(city)}`, query, 'static');
  }

  /**
   * Fares of a city's routes.
   * Cached with the static TTL. `GET /v3/Ship/ODFare/Domestic/City/{City}`
   */
  odFare(city: ShipCity, query?: QueryInput<ShipRouteFare>): Promise<ShipRouteFares> {
    return this.object(`${SHIP}/ODFare/${cityOf(city)}`, query, 'static');
  }

  /**
   * Regular timetables of a city's routes, optionally one route. Cached with the static TTL.
   * `GET /v3/Ship/GeneralSchedule/Domestic/City/{City}[/{RouteID}]`
   */
  generalSchedule(
    city: ShipCity,
    query?: QueryInput<ShipGeneralSchedule>,
  ): Promise<ShipGeneralSchedules>;
  generalSchedule(
    city: ShipCity,
    routeId: ShipRouteId,
    query?: QueryInput<ShipGeneralSchedule>,
  ): Promise<ShipGeneralSchedules>;
  generalSchedule(
    city: ShipCity,
    routeIdOrQuery?: ShipRouteId | QueryInput<ShipGeneralSchedule>,
    query?: QueryInput<ShipGeneralSchedule>,
  ): Promise<ShipGeneralSchedules> {
    const base = `${SHIP}/GeneralSchedule/${cityOf(city)}`;
    return this.object(...optional(base, 'routeId', routeIdOrQuery, query), 'static');
  }

  /**
   * Daily timetables of a city's routes, optionally one route. Dates are `YYYY/MM/DD` here.
   * Cached with the static TTL. `GET /v3/Ship/DailySchedule/Domestic/City/{City}[/{RouteID}]`
   */
  dailySchedule(city: ShipCity, query?: QueryInput<ShipDailySchedule>): Promise<ShipDailySchedules>;
  dailySchedule(
    city: ShipCity,
    routeId: ShipRouteId,
    query?: QueryInput<ShipDailySchedule>,
  ): Promise<ShipDailySchedules>;
  dailySchedule(
    city: ShipCity,
    routeIdOrQuery?: ShipRouteId | QueryInput<ShipDailySchedule>,
    query?: QueryInput<ShipDailySchedule>,
  ): Promise<ShipDailySchedules> {
    const base = `${SHIP}/DailySchedule/${cityOf(city)}`;
    return this.object(...optional(base, 'routeId', routeIdOrQuery, query), 'static');
  }

  /**
   * Live boards of a county's ports. Only LienchiangCounty is served. Cached with the
   * real-time TTL. `GET /v3/Ship/ShipLiveBoard/Domestic/City/{City}`
   */
  liveBoard(city: ShipCity, query?: QueryInput<ShipLiveBoard>): Promise<ShipLiveBoards> {
    return this.object(`${SHIP}/ShipLiveBoard/${cityOf(city)}`, query, 'realtime');
  }

  /** Alerts of a city. Cached with the real-time TTL. `GET /v3/Ship/Alert/Domestic/City/{City}` */
  alerts(city: ShipCity, query?: QueryInput<ShipAlert>): Promise<ShipAlerts> {
    return this.object(`${SHIP}/Alert/${cityOf(city)}`, query, 'realtime');
  }

  /** News of a city. Cached with the real-time TTL. `GET /v3/Ship/News/Domestic/City/{City}` */
  news(city: ShipCity, query?: QueryInput<ShipNews>): Promise<ShipNewsList> {
    return this.object(`${SHIP}/News/${cityOf(city)}`, query, 'realtime');
  }
}

function cityOf(city: ShipCity): string {
  return `Domestic/City/${segment(city, 'city')}`;
}
