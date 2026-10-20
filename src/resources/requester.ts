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

/** Encodes one path segment (city names, Chinese route names such as `紅5`). */
export function segment(value: string, name: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${name} must be a non-empty string`);
  }
  return encodeURIComponent(value.trim());
}
