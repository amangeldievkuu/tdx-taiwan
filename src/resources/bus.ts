import type { BusCity, BusEstimatedTimeOfArrival, BusRoute, BusStopOfRoute } from '../types/bus.js';
import { type ListRequester, type QueryInput, segment } from './requester.js';

/** City bus (市區公車) endpoints. */
export class BusApi {
  constructor(private readonly list: ListRequester) {}

  /**
   * Routes in a city, optionally narrowed to a route name. Cached with the static TTL.
   * `GET /v2/Bus/Route/City/{City}[/{RouteName}]`
   *
   * @example
   * tdx.bus.routes('Taipei')                  // every route
   * tdx.bus.routes('Taipei', '307')           // by route name
   * tdx.bus.routes('Taipei', { top: 10 })     // every route, with a query
   */
  routes(city: BusCity, query?: QueryInput<BusRoute>): Promise<BusRoute[]>;
  routes(city: BusCity, routeName: string, query?: QueryInput<BusRoute>): Promise<BusRoute[]>;
  routes(
    city: BusCity,
    routeNameOrQuery?: string | QueryInput<BusRoute>,
    query?: QueryInput<BusRoute>,
  ): Promise<BusRoute[]> {
    let path = `/v2/Bus/Route/City/${segment(city, 'city')}`;
    if (typeof routeNameOrQuery === 'string') {
      path += `/${segment(routeNameOrQuery, 'routeName')}`;
    } else {
      query = routeNameOrQuery ?? query;
    }
    return this.list(path, query, 'static');
  }

  /**
   * Ordered stops of each sub-route / direction of a route. Cached with the static TTL.
   * `GET /v2/Bus/StopOfRoute/City/{City}/{RouteName}`
   */
  stopsOfRoute(
    city: BusCity,
    routeName: string,
    query?: QueryInput<BusStopOfRoute>,
  ): Promise<BusStopOfRoute[]> {
    return this.list(
      `/v2/Bus/StopOfRoute/City/${segment(city, 'city')}/${segment(routeName, 'routeName')}`,
      query,
      'static',
    );
  }

  /**
   * Estimated time of arrival (N1, batch-updated) at each stop of a route.
   * Cached with the real-time TTL.
   * `GET /v2/Bus/EstimatedTimeOfArrival/City/{City}/{RouteName}`
   */
  eta(
    city: BusCity,
    routeName: string,
    query?: QueryInput<BusEstimatedTimeOfArrival>,
  ): Promise<BusEstimatedTimeOfArrival[]> {
    return this.list(
      `/v2/Bus/EstimatedTimeOfArrival/City/${segment(city, 'city')}/${segment(routeName, 'routeName')}`,
      query,
      'realtime',
    );
  }
}
