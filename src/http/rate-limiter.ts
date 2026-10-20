import { type Sleep, sleep as defaultSleep } from './sleep.js';

export interface RateLimiterOptions {
  now?: () => number;
  sleep?: Sleep;
}

/**
 * Spaces requests evenly at `requestsPerSecond` (e.g. 5 → one request every 200ms).
 * Slots are reserved synchronously, so callers are served in FIFO order.
 * A value of `0` (or less) disables limiting.
 */
export class RateLimiter {
  private readonly intervalMs: number;
  private readonly now: () => number;
  private readonly sleep: Sleep;
  private nextSlot = 0;

  constructor(requestsPerSecond: number, options: RateLimiterOptions = {}) {
    this.intervalMs = requestsPerSecond > 0 ? 1000 / requestsPerSecond : 0;
    this.now = options.now ?? Date.now;
    this.sleep = options.sleep ?? defaultSleep;
  }

  async acquire(): Promise<void> {
    if (this.intervalMs === 0) return;
    const now = this.now();
    const slot = Math.max(now, this.nextSlot);
    this.nextSlot = slot + this.intervalMs;
    if (slot > now) await this.sleep(slot - now);
  }
}
