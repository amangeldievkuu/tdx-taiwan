type Primitive = string | number | boolean | bigint | symbol | null | undefined;

/** Top-level field names of `T` (any string when `T` is untyped). */
export type Field<T> = Extract<keyof T, string>;

/**
 * Field names plus one level of nested paths in OData syntax, e.g. `StationName/Zh_tw`.
 * Used for `$orderby`; `$select` only accepts top-level fields.
 */
export type FieldPath<T> = {
  [K in Field<T>]: NonNullable<T[K]> extends Primitive | readonly unknown[]
    ? K
    : K | `${K}/${Field<NonNullable<T[K]>>}`;
}[Field<T>];

export type SortDirection = 'asc' | 'desc';

/** A circle around a WGS84 point, for `$spatialFilter=nearby(...)`. */
export interface NearbyArea {
  lat: number;
  lon: number;
  /** Radius in metres. */
  meters: number;
}

/** Plain-object form of a query, accepted anywhere an `ODataQuery` is. */
export interface ODataOptions<T = Record<string, unknown>> {
  /** One expression, or several joined with `and`. */
  filter?: string | string[];
  select?: Field<T>[];
  orderBy?: FieldPath<T> | [FieldPath<T>, SortDirection] | Array<[FieldPath<T>, SortDirection]>;
  top?: number;
  skip?: number;
  /** Only items within `meters` of a point (`$spatialFilter=nearby(lat, lon, meters)`). */
  nearby?: NearbyArea;
}

/**
 * Fluent OData query builder. Field names are typed against the response item `T`.
 * `$format=JSON` is always added.
 *
 * @example
 * query<BikeAvailability>()
 *   .filter('AvailableRentBikes gt 0')
 *   .select('StationUID', 'AvailableRentBikes')
 *   .orderBy('AvailableRentBikes', 'desc')
 *   .top(10)
 */
export class ODataQuery<T = Record<string, unknown>> {
  private readonly filters: string[] = [];
  private readonly fields: string[] = [];
  private readonly orders: string[] = [];
  private topValue: number | undefined;
  private skipValue: number | undefined;
  private area: NearbyArea | undefined;

  /** Adds a `$filter` expression. Multiple calls are combined with `and`. */
  filter(expression: string): this {
    const trimmed = expression.trim();
    if (trimmed) this.filters.push(trimmed);
    return this;
  }

  /** Restricts the returned fields (`$select`). */
  select(...fields: Field<T>[]): this {
    for (const field of fields) {
      if (!this.fields.includes(field)) this.fields.push(field);
    }
    return this;
  }

  /** Adds a sort key (`$orderby`). Multiple calls sort by each key in order. */
  orderBy(field: FieldPath<T>, direction: SortDirection = 'asc'): this {
    this.orders.push(direction === 'desc' ? `${field} desc` : field);
    return this;
  }

  /** Returns at most `n` items (`$top`). */
  top(n: number): this {
    this.topValue = assertCount('top', n);
    return this;
  }

  /** Skips the first `n` items (`$skip`). */
  skip(n: number): this {
    this.skipValue = assertCount('skip', n);
    return this;
  }

  /**
   * Only items within `meters` of a WGS84 point (`$spatialFilter=nearby(lat, lon, meters)`).
   * TDX supports it on endpoints whose items have a position, such as bus stops and stations.
   */
  nearby(lat: number, lon: number, meters: number): this {
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      throw new RangeError(`nearby latitude must be between -90 and 90, got ${lat}`);
    }
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      throw new RangeError(`nearby longitude must be between -180 and 180, got ${lon}`);
    }
    if (!Number.isInteger(meters) || meters <= 0) {
      throw new RangeError(
        `nearby radius must be a positive whole number of metres, got ${meters}`,
      );
    }
    this.area = { lat, lon, meters };
    return this;
  }

  /** Encoded query string, e.g. `$filter=...&$top=10&$format=JSON`. */
  toString(): string {
    const params: Array<[string, string]> = [];
    if (this.fields.length) params.push(['$select', this.fields.join(',')]);
    if (this.filters.length) params.push(['$filter', joinFilters(this.filters)]);
    if (this.orders.length) params.push(['$orderby', this.orders.join(',')]);
    if (this.topValue !== undefined) params.push(['$top', String(this.topValue)]);
    if (this.skipValue !== undefined) params.push(['$skip', String(this.skipValue)]);
    if (this.area) {
      const { lat, lon, meters } = this.area;
      params.push(['$spatialFilter', `nearby(${lat},${lon},${meters})`]);
    }
    params.push(['$format', 'JSON']);
    // Encode values with %20 rather than URLSearchParams' `+`, and keep `$` literal in keys.
    return params.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
  }

  /** Returns an independent copy of this query. */
  clone(): ODataQuery<T> {
    const copy = new ODataQuery<T>();
    copy.filters.push(...this.filters);
    copy.fields.push(...this.fields);
    copy.orders.push(...this.orders);
    copy.topValue = this.topValue;
    copy.skipValue = this.skipValue;
    copy.area = this.area;
    return copy;
  }

  /** Normalises a builder, a plain options object or nothing into a builder. */
  static from<T>(input?: ODataQuery<T> | ODataOptions<T>): ODataQuery<T> {
    if (input instanceof ODataQuery) return input;
    const q = new ODataQuery<T>();
    if (!input) return q;
    for (const f of toArray(input.filter)) q.filter(f);
    if (input.select) q.select(...input.select);
    for (const [field, dir] of normalizeOrderBy(input.orderBy)) q.orderBy(field, dir);
    if (input.top !== undefined) q.top(input.top);
    if (input.skip !== undefined) q.skip(input.skip);
    if (input.nearby) q.nearby(input.nearby.lat, input.nearby.lon, input.nearby.meters);
    return q;
  }
}

/** Creates a new query builder typed against the response item `T`. */
export function query<T = Record<string, unknown>>(): ODataQuery<T> {
  return new ODataQuery<T>();
}

/** Helpers for writing `$filter` expressions safely. */
export const odata = {
  /** Quotes a string literal, escaping single quotes: `O'Neil` → `'O''Neil'`. */
  str(value: string): string {
    return `'${value.replace(/'/g, "''")}'`;
  },
};

function joinFilters(filters: string[]): string {
  if (filters.length === 1) return filters[0] as string;
  return filters.map((f) => `(${f})`).join(' and ');
}

function assertCount(name: string, n: number): number {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError(`$${name} must be a non-negative integer, got ${n}`);
  }
  return n;
}

function toArray<V>(value: V | V[] | undefined): V[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeOrderBy<T>(
  orderBy: ODataOptions<T>['orderBy'],
): Array<[FieldPath<T>, SortDirection]> {
  if (orderBy === undefined) return [];
  if (typeof orderBy === 'string') return [[orderBy, 'asc']];
  if (orderBy.length === 2 && typeof orderBy[1] === 'string' && !Array.isArray(orderBy[0])) {
    return [orderBy as [FieldPath<T>, SortDirection]];
  }
  return orderBy as Array<[FieldPath<T>, SortDirection]>;
}
