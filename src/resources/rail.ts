import type {
  RailODDistance,
  RailODFare,
  RailODFareSystem,
  RailODSystem,
  RailOperator,
  RailS2SDistance,
  RailS2SSystem,
} from '../types/rail.js';
import { type ListRequester, type ObjectRequester, type QueryInput, segment } from './requester.js';

/**
 * Cross-system rail feeds (`/v2/Rail/*`): operators, distances and by-name fares that cover
 * metros, light rails, TRA, THSR and the Alishan railway together. Station arguments are
 * **names** as TDX spells them (`板橋`, `臺北`), not IDs.
 */
export class RailApi {
  constructor(
    private readonly list: ListRequester,
    private readonly object: ObjectRequester,
  ) {}

  /** Every rail operator with contact details. Cached with the static TTL. `GET /v2/Rail/Operator` */
  operators(query?: QueryInput<RailOperator>): Promise<RailOperator[]> {
    return this.list('/v2/Rail/Operator', query, 'static');
  }

  /**
   * Distances between every pair of stations of a system, or between two stations by name.
   * Cached with the static TTL.
   * `GET /v2/Rail/ODDistance/{RailSystem}[/{OriginStationName}/to/{DestinationStationName}]`
   */
  odDistance(system: RailODSystem, query?: QueryInput<RailODDistance>): Promise<RailODDistance[]>;
  odDistance(
    system: RailODSystem,
    from: string,
    to: string,
    query?: QueryInput<RailODDistance>,
  ): Promise<RailODDistance[]>;
  odDistance(
    system: RailODSystem,
    fromOrQuery?: string | QueryInput<RailODDistance>,
    to?: string,
    query?: QueryInput<RailODDistance>,
  ): Promise<RailODDistance[]> {
    const base = `/v2/Rail/ODDistance/${segment(system, 'system')}`;
    if (typeof fromOrQuery === 'string') {
      const path = `${base}/${segment(fromOrQuery, 'from')}/to/${segment(to ?? '', 'to')}`;
      return this.list(path, query, 'static');
    }
    return this.list(base, fromOrQuery ?? query, 'static');
  }

  /**
   * Fares between two stations looked up by name, with Chinese labels. Returns an object; the
   * query applies to its `ODFares`. Cached with the static TTL.
   * `GET /v2/Rail/ODFare/{RailSystem}/{OriginStationName}/to/{DestinationStationName}`
   */
  odFare(
    system: RailODFareSystem,
    from: string,
    to: string,
    query?: QueryInput<RailODFare>,
  ): Promise<RailODFare> {
    const path = `/v2/Rail/ODFare/${segment(system, 'system')}/${segment(from, 'from')}/to/${segment(to, 'to')}`;
    return this.object(path, query, 'static');
  }

  /**
   * Distances between adjacent stations, per line. Cached with the static TTL.
   * `GET /v2/Rail/S2SDistance/{RailSystem}`
   */
  s2sDistance(
    system: RailS2SSystem,
    query?: QueryInput<RailS2SDistance>,
  ): Promise<RailS2SDistance[]> {
    return this.list(`/v2/Rail/S2SDistance/${segment(system, 'system')}`, query, 'static');
  }
}
