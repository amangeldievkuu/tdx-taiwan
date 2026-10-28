# Caching

## In memory

With `cache: true`, responses are cached in memory per URL: static data (stations, routes,
timetables, fares, reference lists) for 1 hour and real-time data (availability, ETAs, live
boards, positions, alerts) for 15 seconds. Identical concurrent requests share one HTTP call,
failures are never cached, and every caller receives its own copy of the data.

```ts
new TdxClient({
  clientId,
  clientSecret,
  cache: { staticTtlMs: 60 * 60_000, realtimeTtlMs: 15_000, maxEntries: 500 },
});
```

`tdx.clearCache()` empties it.

## Across restarts

Give the cache a `store` and static responses are also written there, for 24 hours by default
(`storeTtlMs`), so a new process reads them instead of calling TDX again. This helps
short-lived processes (CLIs, serverless functions, MCP servers) that would otherwise refetch the
same station and route lists on every start, using up the per-minute quota. Real-time data is
never stored.

`FileCacheStore` keeps one JSON file per URL in a directory (Node.js only):

```ts
import { TdxClient } from 'tdx-taiwan';
import { FileCacheStore } from 'tdx-taiwan/file-cache';

const store = new FileCacheStore('.cache/tdx');
const tdx = new TdxClient({ clientId, clientSecret, cache: { store } });
await store.prune(); // optional: delete expired files
```

- The store is read only when the in-memory cache misses, and what it returns is kept in memory
  as usual.
- Files are written to a temporary name and renamed into place, so processes sharing a
  directory never read half a file. Unreadable, foreign or expired files count as misses.
- `prune()` deletes expired files; `clear()` deletes all of them. `tdx.clearCache()` empties
  the in-memory cache only.

### Other backends

Any object with `get(key)` and `set(key, value, ttlMs)` returning promises is a store
(`TdxCacheStore`), e.g. one backed by Redis:

```ts
import type { TdxCacheStore } from 'tdx-taiwan';

const redisStore: TdxCacheStore = {
  get: async (key) => {
    const text = await redis.get(`tdx:${key}`);
    return text === null ? undefined : JSON.parse(text);
  },
  set: async (key, value, ttlMs) => {
    await redis.set(`tdx:${key}`, JSON.stringify(value), { PX: ttlMs });
  },
};
```

Store errors are ignored: a failed read is a miss and a failed write is skipped, so a broken
store never fails a request.

## 繁體中文

設定 `cache: true` 後，回應依 URL 快取於記憶體：靜態資料（站點、路線、時刻表、票價）1 小時，即時資料（車位、到站、看板、位置）15 秒。

另可設定 `cache: { store: new FileCacheStore(dir) }`（`tdx-taiwan/file-cache`），將靜態資料寫入磁碟 24 小時（`storeTtlMs`），重新啟動後不必再呼叫 TDX；即時資料不會寫入。任何具備 `get(key)`、`set(key, value, ttlMs)` 的物件（例如 Redis）皆可作為 `TdxCacheStore`；儲存發生錯誤時會略過，不影響請求。
