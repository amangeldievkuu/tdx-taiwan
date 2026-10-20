export type Sleep = (ms: number) => Promise<void>;

/**
 * Timer audit (see tests/dist/open-handles.mjs):
 * - `sleep` is always awaited by an in-flight request (rate limiter, retry backoff), so it is
 *   deliberately left ref'd: unref'ing it could let Node exit with that request unfinished.
 * - Request timeouts use `AbortSignal.timeout()`, whose timer Node already unrefs.
 * - There are no intervals; the response cache expires entries lazily on read.
 */
export const sleep: Sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
