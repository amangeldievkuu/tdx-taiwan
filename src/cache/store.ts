/**
 * A second, persistent level for the response cache: static responses (stations, routes,
 * timetables, reference lists) are written here as well, so a new process can answer from it
 * instead of calling TDX again. Real-time responses are never stored.
 *
 * Errors from a store are ignored: a failed read is a miss, a failed write is skipped.
 */
export interface TdxCacheStore {
  /** The value stored under `key`, or `undefined` when there is none or it has expired. */
  get(key: string): Promise<unknown>;
  /** Stores `value` under `key` for `ttlMs` milliseconds. */
  set(key: string, value: unknown, ttlMs: number): Promise<void>;
}
