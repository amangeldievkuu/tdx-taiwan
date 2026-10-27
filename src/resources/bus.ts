import { ODataQuery, odata, type ODataOptions } from '../odata/query-builder.js';
import type {
  BusAlert,
  BusCity,
  BusEstimatedTimeOfArrival,
  BusNews,
  BusPosition,
  BusRoute,
  BusSchedule,
  BusStation,
  BusStopInfo,
  BusStopOfRoute,
} from '../types/bus.js';
import { type ListRequester, type QueryInput, segment } from './requester.js';

/** Plain-object query for endpoints addressed by a route name. */
export interface RouteQueryOptions<T> extends ODataOptions<T> {
  /**
   * Match the route name exactly (default `true`). TDX itself matches it as a prefix, so with
   * `exact: false` `'307'` also returns `307西藏三民`, and `'紅5'` also returns `紅50`, `紅55`...
   */
  exact?: boolean;
}

/** A query builder (always an exact route match) or a plain options object. */
export type RouteQueryInput<T> = ODataQuery<T> | RouteQueryOptions<T>;

/** City bus (市區公車) endpoints, plus InterCity coaches under `interCity`. */
export class BusApi {
  /** InterCity coach (公路客運) endpoints. */
  readonly interCity: InterCityBusApi;

  constructor(private readonly list: ListRequester) {
    this.interCity = new InterCityBusApi(list);
  }

  /**
   * Every stop in a city. Cached with the static TTL. The list is large (about 29,000 stops
   * for Taipei), so narrow it with `$filter` / `$select` where you can.
   * `GET /v2/Bus/Stop/City/{City}`
   */
  stops(city: BusCity, query?: QueryInput<BusStopInfo>): Promise<BusStopInfo[]> {
    return this.list(`/v2/Bus/Stop/City/${segment(city, 'city')}`, query, 'static');
  }

  /**
   * Every station in a city, each with the routes that stop there. Cached with the static TTL.
   * The list is large, so pass `nearby` (TDX's `$spatialFilter`) for the stations around a
   * point. `GET /v2/Bus/Station/City/{City}`
   *
   * @example tdx.bus.stations('Taipei', { nearby: { lat: 25.0478, lon: 121.517, meters: 300 } })
   */
  stations(city: BusCity, query?: QueryInput<BusStation>): Promise<BusStation[]> {
    return this.list(`/v2/Bus/Station/City/${segment(city, 'city')}`, query, 'static');
  }

  /**
   * Live positions of the vehicles on a route (A1, batch-updated). Cached with the real-time
   * TTL. `GET /v2/Bus/RealTimeByFrequency/City/{City}/{RouteName}`
   */
  positions(
    city: BusCity,
    routeName: string,
    query?: RouteQueryInput<BusPosition>,
  ): Promise<BusPosition[]> {
    const base = `/v2/Bus/RealTimeByFrequency/City/${segment(city, 'city')}`;
    return this.list(...byRouteName(base, routeName, query), 'realtime');
  }

  /**
   * Routes in a city, optionally narrowed to one route name (matched exactly by default).
   * Cached with the static TTL.
   * `GET /v2/Bus/Route/City/{City}[/{RouteName}]`
   *
   * @example
   * tdx.bus.routes('Taipei')                     // every route
   * tdx.bus.routes('Taipei', '307')              // route 307 only
   * tdx.bus.routes('Taipei', '307', { exact: false }) // 307, 307西藏三民, ...
   * tdx.bus.routes('Taipei', { top: 10 })        // every route, with a query
   */
  routes(city: BusCity, query?: QueryInput<BusRoute>): Promise<BusRoute[]>;
  routes(city: BusCity, routeName: string, query?: RouteQueryInput<BusRoute>): Promise<BusRoute[]>;
  routes(
    city: BusCity,
    routeNameOrQuery?: string | QueryInput<BusRoute>,
    query?: RouteQueryInput<BusRoute>,
  ): Promise<BusRoute[]> {
    const base = `/v2/Bus/Route/City/${segment(city, 'city')}`;
    if (typeof routeNameOrQuery === 'string') {
      return this.list(...byRouteName(base, routeNameOrQuery, query), 'static');
    }
    return this.list(base, routeNameOrQuery ?? query, 'static');
  }

  /**
   * Ordered stops of each sub-route / direction of a route (matched exactly by default).
   * Cached with the static TTL.
   * `GET /v2/Bus/StopOfRoute/City/{City}/{RouteName}`
   */
  stopsOfRoute(
    city: BusCity,
    routeName: string,
    query?: RouteQueryInput<BusStopOfRoute>,
  ): Promise<BusStopOfRoute[]> {
    const base = `/v2/Bus/StopOfRoute/City/${segment(city, 'city')}`;
    return this.list(...byRouteName(base, routeName, query), 'static');
  }

  /**
   * Estimated time of arrival (N1, batch-updated) at each stop of a route (matched exactly by
   * default), or, without a route name, of every route at every stop in the city: filter that
   * list (e.g. `StopUID eq 'TPE34726' or StopUID eq 'TPE35854'`) for one stop's arrivals in a
   * single call. Cached with the real-time TTL.
   * `GET /v2/Bus/EstimatedTimeOfArrival/City/{City}[/{RouteName}]`
   *
   * @example tdx.bus.eta('Taipei', { filter: "StopUID eq 'TPE34726'" }) // every route at one stop
   */
  eta(
    city: BusCity,
    query?: QueryInput<BusEstimatedTimeOfArrival>,
  ): Promise<BusEstimatedTimeOfArrival[]>;
  eta(
    city: BusCity,
    routeName: string,
    query?: RouteQueryInput<BusEstimatedTimeOfArrival>,
  ): Promise<BusEstimatedTimeOfArrival[]>;
  eta(
    city: BusCity,
    routeNameOrQuery?: string | QueryInput<BusEstimatedTimeOfArrival>,
    query?: RouteQueryInput<BusEstimatedTimeOfArrival>,
  ): Promise<BusEstimatedTimeOfArrival[]> {
    const base = `/v2/Bus/EstimatedTimeOfArrival/City/${segment(city, 'city')}`;
    if (typeof routeNameOrQuery === 'string') {
      return this.list(...byRouteName(base, routeNameOrQuery, query), 'realtime');
    }
    return this.list(base, routeNameOrQuery, 'realtime');
  }

  /**
   * Scheduled trips or headways of each sub-route of a route (matched exactly by default), or
   * of every route in the city. Cached with the static TTL. Kaohsiung publishes none.
   * `GET /v2/Bus/Schedule/City/{City}[/{RouteName}]`
   */
  schedule(city: BusCity, query?: QueryInput<BusSchedule>): Promise<BusSchedule[]>;
  schedule(
    city: BusCity,
    routeName: string,
    query?: RouteQueryInput<BusSchedule>,
  ): Promise<BusSchedule[]>;
  schedule(
    city: BusCity,
    routeNameOrQuery?: string | QueryInput<BusSchedule>,
    query?: RouteQueryInput<BusSchedule>,
  ): Promise<BusSchedule[]> {
    const base = `/v2/Bus/Schedule/City/${segment(city, 'city')}`;
    if (typeof routeNameOrQuery === 'string') {
      return this.list(...byRouteName(base, routeNameOrQuery, query), 'static');
    }
    return this.list(base, routeNameOrQuery, 'static');
  }

  /**
   * Service alerts (detours, suspensions, moved stops) of a city's buses, with the routes and
   * stops they affect. Cached with the real-time TTL. `GET /v2/Bus/Alert/City/{City}`
   */
  alerts(city: BusCity, query?: QueryInput<BusAlert>): Promise<BusAlert[]> {
    return this.list(`/v2/Bus/Alert/City/${segment(city, 'city')}`, query, 'realtime');
  }

  /**
   * News of a city's bus authority. Cached with the real-time TTL.
   * `GET /v2/Bus/News/City/{City}`
   */
  news(city: BusCity, query?: QueryInput<BusNews>): Promise<BusNews[]> {
    return this.list(`/v2/Bus/News/City/${segment(city, 'city')}`, query, 'realtime');
  }
}

/**
 * InterCity coach (公路客運) endpoints. Route names are matched exactly by default, as for city
 * buses: TDX treats `'9'` as a prefix and would return every `9xxx` route.
 */
export class InterCityBusApi {
  constructor(private readonly list: ListRequester) {}

  /**
   * InterCity routes, optionally narrowed to one route name. Cached with the static TTL.
   * `GET /v2/Bus/Route/InterCity[/{RouteName}]`
   */
  routes(query?: QueryInput<BusRoute>): Promise<BusRoute[]>;
  routes(routeName: string, query?: RouteQueryInput<BusRoute>): Promise<BusRoute[]>;
  routes(
    routeNameOrQuery?: string | QueryInput<BusRoute>,
    query?: RouteQueryInput<BusRoute>,
  ): Promise<BusRoute[]> {
    const base = '/v2/Bus/Route/InterCity';
    if (typeof routeNameOrQuery === 'string') {
      return this.list(...byRouteName(base, routeNameOrQuery, query), 'static');
    }
    return this.list(base, routeNameOrQuery ?? query, 'static');
  }

  /**
   * Ordered stops of each sub-route / direction of a route. Cached with the static TTL.
   * `GET /v2/Bus/StopOfRoute/InterCity/{RouteName}`
   */
  stopsOfRoute(
    routeName: string,
    query?: RouteQueryInput<BusStopOfRoute>,
  ): Promise<BusStopOfRoute[]> {
    return this.list(...byRouteName('/v2/Bus/StopOfRoute/InterCity', routeName, query), 'static');
  }

  /**
   * Estimated time of arrival (N1, batch-updated) at each stop of a route, or, without a route
   * name, of every coach route at every stop: filter it on `StopUID` for one stop.
   * Cached with the real-time TTL.
   * `GET /v2/Bus/EstimatedTimeOfArrival/InterCity[/{RouteName}]`
   */
  eta(query?: QueryInput<BusEstimatedTimeOfArrival>): Promise<BusEstimatedTimeOfArrival[]>;
  eta(
    routeName: string,
    query?: RouteQueryInput<BusEstimatedTimeOfArrival>,
  ): Promise<BusEstimatedTimeOfArrival[]>;
  eta(
    routeNameOrQuery?: string | QueryInput<BusEstimatedTimeOfArrival>,
    query?: RouteQueryInput<BusEstimatedTimeOfArrival>,
  ): Promise<BusEstimatedTimeOfArrival[]> {
    const base = '/v2/Bus/EstimatedTimeOfArrival/InterCity';
    if (typeof routeNameOrQuery === 'string') {
      return this.list(...byRouteName(base, routeNameOrQuery, query), 'realtime');
    }
    return this.list(base, routeNameOrQuery, 'realtime');
  }

  /**
   * Scheduled trips of each sub-route of a coach route, or of every route. Cached with the
   * static TTL. `GET /v2/Bus/Schedule/InterCity[/{RouteName}]`
   */
  schedule(query?: QueryInput<BusSchedule>): Promise<BusSchedule[]>;
  schedule(routeName: string, query?: RouteQueryInput<BusSchedule>): Promise<BusSchedule[]>;
  schedule(
    routeNameOrQuery?: string | QueryInput<BusSchedule>,
    query?: RouteQueryInput<BusSchedule>,
  ): Promise<BusSchedule[]> {
    const base = '/v2/Bus/Schedule/InterCity';
    if (typeof routeNameOrQuery === 'string') {
      return this.list(...byRouteName(base, routeNameOrQuery, query), 'static');
    }
    return this.list(base, routeNameOrQuery, 'static');
  }

  /**
   * Coach service alerts, with the operators, routes and stops they affect. Cached with the
   * real-time TTL. `GET /v2/Bus/Alert/InterCity`
   */
  alerts(query?: QueryInput<BusAlert>): Promise<BusAlert[]> {
    return this.list('/v2/Bus/Alert/InterCity', query, 'realtime');
  }

  /**
   * News of the coach authority (公路局). Cached with the real-time TTL.
   * `GET /v2/Bus/News/InterCity`
   */
  news(query?: QueryInput<BusNews>): Promise<BusNews[]> {
    return this.list('/v2/Bus/News/InterCity', query, 'realtime');
  }

  /**
   * Live positions of the vehicles on a route (A1, batch-updated). Cached with the real-time
   * TTL. `GET /v2/Bus/RealTimeByFrequency/InterCity/{RouteName}`
   */
  positions(routeName: string, query?: RouteQueryInput<BusPosition>): Promise<BusPosition[]> {
    const base = '/v2/Bus/RealTimeByFrequency/InterCity';
    return this.list(...byRouteName(base, routeName, query), 'realtime');
  }

  /**
   * InterCity stations, each with the coach routes that stop there. Cached with the static
   * TTL. Pass `nearby` for the stations around a point. `GET /v2/Bus/Station/InterCity`
   */
  stations(query?: QueryInput<BusStation>): Promise<BusStation[]> {
    return this.list('/v2/Bus/Station/InterCity', query, 'static');
  }
}

/**
 * Builds the path and query for a route-name endpoint. TDX matches the `{RouteName}` segment as
 * a prefix of `RouteName/Zh_tw` and returns 404 for names containing `/` (some Kinmen routes), so
 * an exact match requests the part before any `/` and filters on the full name.
 */
function byRouteName<T>(
  base: string,
  routeName: string,
  query: RouteQueryInput<T> | undefined,
): [string, QueryInput<T> | undefined] {
  if (query && !(query instanceof ODataQuery) && query.exact === false) {
    return [`${base}/${segment(routeName, 'routeName')}`, query];
  }
  segment(routeName, 'routeName'); // validates
  const name = routeName.trim();
  const exact = query instanceof ODataQuery ? query.clone() : ODataQuery.from(query);
  exact.filter(`RouteName/Zh_tw eq ${odata.str(name)}`);
  return [`${base}/${segment(name.split('/')[0] ?? '', 'routeName')}`, exact];
}
