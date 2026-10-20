import { ODataQuery, odata, type ODataOptions } from '../odata/query-builder.js';
import type {
  BusCity,
  BusEstimatedTimeOfArrival,
  BusPosition,
  BusRoute,
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
   * default). Cached with the real-time TTL.
   * `GET /v2/Bus/EstimatedTimeOfArrival/City/{City}/{RouteName}`
   */
  eta(
    city: BusCity,
    routeName: string,
    query?: RouteQueryInput<BusEstimatedTimeOfArrival>,
  ): Promise<BusEstimatedTimeOfArrival[]> {
    const base = `/v2/Bus/EstimatedTimeOfArrival/City/${segment(city, 'city')}`;
    return this.list(...byRouteName(base, routeName, query), 'realtime');
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
   * Estimated time of arrival (N1, batch-updated) at each stop of a route.
   * Cached with the real-time TTL.
   * `GET /v2/Bus/EstimatedTimeOfArrival/InterCity/{RouteName}`
   */
  eta(
    routeName: string,
    query?: RouteQueryInput<BusEstimatedTimeOfArrival>,
  ): Promise<BusEstimatedTimeOfArrival[]> {
    const base = '/v2/Bus/EstimatedTimeOfArrival/InterCity';
    return this.list(...byRouteName(base, routeName, query), 'realtime');
  }

  /**
   * Live positions of the vehicles on a route (A1, batch-updated). Cached with the real-time
   * TTL. `GET /v2/Bus/RealTimeByFrequency/InterCity/{RouteName}`
   */
  positions(routeName: string, query?: RouteQueryInput<BusPosition>): Promise<BusPosition[]> {
    const base = '/v2/Bus/RealTimeByFrequency/InterCity';
    return this.list(...byRouteName(base, routeName, query), 'realtime');
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
