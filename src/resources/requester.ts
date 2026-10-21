import type { ODataOptions, ODataQuery } from '../odata/query-builder.js';

/** A query builder or plain options object, typed against the response item `T`. */
export type QueryInput<T> = ODataQuery<T> | ODataOptions<T>;

/** `static` data (stations, routes) is cached long; `realtime` data (availability, ETA) briefly. */
export type CacheClass = 'static' | 'realtime';

/** Fetches a list endpoint. Implemented by `TdxClient`. */
export type ListRequester = <T>(
  path: string,
  query: QueryInput<T> | undefined,
  cacheClass: CacheClass,
) => Promise<T[]>;

/**
 * Fetches an endpoint that wraps its items in an object (e.g. `{ UpdateTime, AvailableSeats }`).
 * The query applies to the wrapped items (`Item`). Implemented by `TdxClient`.
 */
export type ObjectRequester = <T extends object, Item>(
  path: string,
  query: QueryInput<Item> | undefined,
  cacheClass: CacheClass,
) => Promise<T>;

/** Encodes one path segment (city names, Chinese route names such as `紅5`). */
export function segment(value: string, name: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${name} must be a non-empty string`);
  }
  return encodeURIComponent(value.trim());
}

const taipeiDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Taipei',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Formats a service date as TDX expects (`YYYY-MM-DD`). A `Date` is converted to the calendar
 * day in Taiwan (UTC+8), and no argument means today in Taiwan, whatever the local time zone.
 *
 * @example trainDate(new Date('2026-10-20T16:30:00Z')) // '2026-10-21'
 */
export function trainDate(date: Date | string = new Date()): string {
  if (typeof date === 'string') {
    // The round trip rejects impossible days such as 2026-02-30.
    const parsed = new Date(`${date}T00:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== date
    ) {
      throw new TypeError(
        `date must be a YYYY-MM-DD string or a Date, got ${JSON.stringify(date)}`,
      );
    }
    return date;
  }
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new TypeError('date must be a valid Date or a YYYY-MM-DD string');
  }
  return taipeiDate.format(date);
}

/**
 * Resolves an optional trailing path segment that may have been omitted in favour of the query:
 * `[path, query]` for `method(value, query?)` and `method(query?)` overloads.
 */
export function optional<T>(
  base: string,
  name: string,
  valueOrQuery: string | QueryInput<T> | undefined,
  query: QueryInput<T> | undefined,
): [string, QueryInput<T> | undefined] {
  if (typeof valueOrQuery === 'string') return [`${base}/${segment(valueOrQuery, name)}`, query];
  return [base, valueOrQuery ?? query];
}
