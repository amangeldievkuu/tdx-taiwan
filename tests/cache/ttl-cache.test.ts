import { describe, expect, it } from 'vitest';
import { TtlCache } from '../../src/cache/ttl-cache.js';
import { fakeClock } from '../helpers.js';

describe('TtlCache', () => {
  it('returns values until their TTL elapses', () => {
    const clock = fakeClock(0);
    const cache = new TtlCache<string>(10, clock.now);

    cache.set('a', 'A', 1000);
    clock.advance(999);
    expect(cache.get('a')).toBe('A');
    clock.advance(1);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it('evicts the least recently used entry when full', () => {
    const cache = new TtlCache<number>(2);

    cache.set('a', 1, 60_000);
    cache.set('b', 2, 60_000);
    cache.get('a');
    cache.set('c', 3, 60_000);

    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBe(3);
  });

  it('ignores non-positive TTLs and supports conditional delete and clear', () => {
    const cache = new TtlCache<string>(5);

    cache.set('zero', 'x', 0);
    expect(cache.get('zero')).toBeUndefined();

    cache.set('k', 'v1', 1000);
    cache.delete('k', 'other');
    expect(cache.get('k')).toBe('v1');
    cache.delete('k', 'v1');
    expect(cache.get('k')).toBeUndefined();

    cache.set('k', 'v', 1000);
    cache.clear();
    expect(cache.size).toBe(0);
  });
});
