export const BASE_DELAY_MS = 500;
export const MAX_DELAY_MS = 30_000;

/** 429 and 5xx are transient; everything else is returned to the caller as-is. */
export function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

/**
 * Exponential backoff with full jitter: a random delay in `[0, base · 2^attempt)`,
 * capped at `MAX_DELAY_MS`. `attempt` is 0 for the first retry.
 */
export function backoffDelay(attempt: number, random: () => number = Math.random): number {
  const ceiling = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** attempt);
  return Math.floor(random() * ceiling);
}

/** Parses a `Retry-After` header (delta-seconds or HTTP-date) into milliseconds. */
export function parseRetryAfter(
  value: string | null,
  now: number = Date.now(),
): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const trimmed = value.trim();
  if (/^\d+(\.\d+)?$/.test(trimmed)) return Math.round(Number(trimmed) * 1000);
  const date = Date.parse(trimmed);
  if (Number.isNaN(date)) return undefined;
  return Math.max(0, date - now);
}

/** Delay before the next retry: honour `Retry-After` when present, otherwise jittered backoff. */
export function retryDelay(
  attempt: number,
  retryAfterMs: number | undefined,
  random?: () => number,
): number {
  if (retryAfterMs !== undefined) return Math.min(retryAfterMs, MAX_DELAY_MS);
  return backoffDelay(attempt, random);
}
