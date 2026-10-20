// Exercises the built client (rate limiter waits, a retry backoff, cache, request timeouts)
// and then simply ends. If any timer were left referenced, this process would not exit
// promptly — the parent test enforces a deadline far below the 30s request timeout.
import { TdxClient } from 'tdx-taiwan';

let calls = 0;
const tdx = new TdxClient({
  clientId: 'id',
  clientSecret: 'secret',
  requestsPerSecond: 20,
  cache: true,
  fetch: async (url) => {
    if (url.includes('/token')) {
      return new Response(JSON.stringify({ access_token: 't', expires_in: 3600 }));
    }
    calls += 1;
    // The first API call fails once to trigger a backoff sleep.
    if (calls === 1) return new Response('busy', { status: 503 });
    return new Response('[]');
  },
});

await Promise.all([
  tdx.bike.stations('Taipei'),
  tdx.bike.availability('Taipei'),
  tdx.bus.eta('Taipei', '307'),
]);

const timers = process.getActiveResourcesInfo().filter((r) => r === 'Timeout');
console.log(JSON.stringify({ calls, timers: timers.length }));
