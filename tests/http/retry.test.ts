import { describe, expect, it } from 'vitest';
import {
  BASE_DELAY_MS,
  MAX_DELAY_MS,
  backoffDelay,
  isRetryableStatus,
  parseRetryAfter,
  retryDelay,
} from '../../src/http/retry.js';

describe('isRetryableStatus', () => {
  it('retries 429 and 5xx only', () => {
    expect([429, 500, 502, 503, 504].every(isRetryableStatus)).toBe(true);
    expect([400, 401, 403, 404, 422].some(isRetryableStatus)).toBe(false);
  });
});

describe('backoffDelay', () => {
  it('grows exponentially: the ceiling doubles each attempt', () => {
    const almostOne = () => 0.999_999;
    expect(backoffDelay(0, almostOne)).toBe(BASE_DELAY_MS - 1);
    expect(backoffDelay(1, almostOne)).toBe(BASE_DELAY_MS * 2 - 1);
    expect(backoffDelay(2, almostOne)).toBe(BASE_DELAY_MS * 4 - 1);
  });

  it('applies full jitter between 0 and the ceiling', () => {
    expect(backoffDelay(2, () => 0)).toBe(0);
    expect(backoffDelay(2, () => 0.5)).toBe(BASE_DELAY_MS * 2);
    for (let i = 0; i < 200; i++) {
      const d = backoffDelay(2);
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThan(BASE_DELAY_MS * 4);
    }
  });

  it('is capped', () => {
    expect(backoffDelay(30, () => 0.999_999)).toBeLessThan(MAX_DELAY_MS);
  });
});

describe('parseRetryAfter', () => {
  it('parses delta-seconds', () => {
    expect(parseRetryAfter('2')).toBe(2000);
    expect(parseRetryAfter(' 1.5 ')).toBe(1500);
  });

  it('parses an HTTP date relative to now', () => {
    const now = Date.parse('2026-10-20T00:00:00Z');
    expect(parseRetryAfter('Tue, 20 Oct 2026 00:00:05 GMT', now)).toBe(5000);
    expect(parseRetryAfter('Mon, 19 Oct 2026 00:00:00 GMT', now)).toBe(0);
  });

  it('ignores missing or invalid values', () => {
    expect(parseRetryAfter(null)).toBeUndefined();
    expect(parseRetryAfter('')).toBeUndefined();
    expect(parseRetryAfter('soon')).toBeUndefined();
  });
});

describe('retryDelay', () => {
  it('prefers Retry-After, capped at the maximum delay', () => {
    expect(retryDelay(0, 2000, () => 0)).toBe(2000);
    expect(retryDelay(0, 10 * 60_000)).toBe(MAX_DELAY_MS);
    expect(retryDelay(1, undefined, () => 0.5)).toBe(BASE_DELAY_MS);
  });
});
