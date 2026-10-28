import { describe, expect, it } from 'vitest';
import type { TdxCacheStore } from '../../src/index.js';
import { clientWithResponse, loadFixture } from '../helpers.js';

const stations = loadFixture('bike-station-taipei.json');

/** An in-memory store that records what it was given. */
function memoryStore() {
  const entries = new Map<string, { value: unknown; ttlMs: number }>();
  const store: TdxCacheStore = {
    get: (key) => Promise.resolve(entries.get(key)?.value),
    set: (key, value, ttlMs) => {
      entries.set(key, { value, ttlMs });
      return Promise.resolve();
    },
  };
  return { store, entries };
}

describe('TdxClient cache store', () => {
  it('keeps static responses in the store for a day, so a new client needs no call', async () => {
    const { store, entries } = memoryStore();
    const first = clientWithResponse(stations, { cache: { store } });
    await first.tdx.bike.stations('Taipei');
    expect(first.apiUrls).toHaveLength(1);
    expect([...entries.values()].map((e) => e.ttlMs)).toEqual([24 * 60 * 60 * 1000]);

    const second = clientWithResponse([], { cache: { store } });
    const result = await second.tdx.bike.stations('Taipei');
    expect(second.apiUrls).toHaveLength(0);
    expect(result).toEqual(stations);
  });

  it('never stores real-time responses', async () => {
    const { store, entries } = memoryStore();
    const { tdx } = clientWithResponse([], { cache: { store } });
    await tdx.bike.availability('Taipei');
    expect(entries.size).toBe(0);
  });

  it('uses storeTtlMs, and keeps working when the store fails', async () => {
    const { store, entries } = memoryStore();
    const custom = clientWithResponse(stations, { cache: { store, storeTtlMs: 60_000 } });
    await custom.tdx.bike.stations('Taipei');
    expect([...entries.values()][0]?.ttlMs).toBe(60_000);

    const broken: TdxCacheStore = {
      get: () => Promise.reject(new Error('disk gone')),
      set: () => Promise.reject(new Error('disk full')),
    };
    const failing = clientWithResponse(stations, { cache: { store: broken } });
    await expect(failing.tdx.bike.stations('Taipei')).resolves.toEqual(stations);
    expect(failing.apiUrls).toHaveLength(1);
  });

  it('is only consulted when the in-memory cache misses', async () => {
    let reads = 0;
    const { store } = memoryStore();
    const counting: TdxCacheStore = {
      get: (key) => {
        reads++;
        return store.get(key);
      },
      set: (key, value, ttl) => store.set(key, value, ttl),
    };
    const { tdx } = clientWithResponse(stations, { cache: { store: counting } });
    await tdx.bike.stations('Taipei');
    await tdx.bike.stations('Taipei');
    expect(reads).toBe(1);
  });
});
