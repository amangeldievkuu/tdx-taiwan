import { afterEach, describe, expect, it, vi } from 'vitest';
import { RateLimiter } from '../../src/http/rate-limiter.js';
import { fakeClock } from '../helpers.js';

describe('RateLimiter', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('spaces requests evenly at the configured rate', async () => {
    const clock = fakeClock(0);
    const waits: number[] = [];
    const limiter = new RateLimiter(5, {
      now: clock.now,
      sleep: (ms) => {
        waits.push(ms);
        return Promise.resolve();
      },
    });

    await Promise.all(Array.from({ length: 5 }, () => limiter.acquire()));

    expect(waits).toEqual([200, 400, 600, 800]);
  });

  it('does not wait when requests are already spaced out', async () => {
    const clock = fakeClock(0);
    const sleep = vi.fn(async () => {});
    const limiter = new RateLimiter(2, { now: clock.now, sleep });

    await limiter.acquire();
    clock.advance(500);
    await limiter.acquire();
    clock.advance(1000);
    await limiter.acquire();

    expect(sleep).not.toHaveBeenCalled();
  });

  it('is disabled when requestsPerSecond is 0', async () => {
    const sleep = vi.fn(async () => {});
    const limiter = new RateLimiter(0, { sleep });

    await Promise.all(Array.from({ length: 50 }, () => limiter.acquire()));

    expect(sleep).not.toHaveBeenCalled();
  });

  it('releases callers in order over real (fake-timer) time', async () => {
    vi.useFakeTimers({ now: 0 });
    const limiter = new RateLimiter(10);
    const released: number[] = [];

    for (let i = 0; i < 3; i++) void limiter.acquire().then(() => released.push(Date.now()));

    await vi.advanceTimersByTimeAsync(0);
    expect(released).toEqual([0]);
    await vi.advanceTimersByTimeAsync(100);
    expect(released).toEqual([0, 100]);
    await vi.advanceTimersByTimeAsync(100);
    expect(released).toEqual([0, 100, 200]);
  });
});
