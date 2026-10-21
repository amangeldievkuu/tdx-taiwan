# tdx-taiwan

[![npm](https://img.shields.io/npm/v/tdx-taiwan)](https://www.npmjs.com/package/tdx-taiwan)
[![CI](https://github.com/amangeldievkuu/tdx-taiwan/actions/workflows/ci.yml/badge.svg)](https://github.com/amangeldievkuu/tdx-taiwan/actions/workflows/ci.yml)
[![node](https://img.shields.io/node/v/tdx-taiwan)](https://www.npmjs.com/package/tdx-taiwan)
[![license](https://img.shields.io/npm/l/tdx-taiwan)](https://github.com/amangeldievkuu/tdx-taiwan/blob/main/LICENSE)

Unofficial TypeScript SDK for Taiwan's [TDX (Transport Data eXchange)](https://tdx.transportdata.tw) API
— YouBike availability, city and InterCity bus routes, arrival estimates and live positions, metro stations, live boards, alerts,
timetables and fares, high speed rail timetables, fares and seat availability, Taiwan
Railway timetables, fares, live boards and train positions, parking availability, EV
charging stations with live connector status, live airport departure and arrival boards, road
traffic with live section speeds, cameras, detectors, eTag travel times and road events, and
ferry routes, timetables, fares and live port boards.

- OAuth2 client-credentials auth with in-memory token caching and automatic refresh
- Retries with exponential backoff + jitter on 429, 5xx and network errors, and a client-side rate limiter
- Typed OData query builder (`$filter`, `$select`, `$orderby`, `$top`, `$skip`)
- Response types transcribed from the official TDX OpenAPI specs
- Optional in-memory response cache
- Optional NestJS module (`tdx-taiwan/nestjs`)
- Zero runtime dependencies; native `fetch`; ESM + CommonJS; Node.js 20+

[繁體中文說明](#繁體中文)

## Install

```sh
npm install tdx-taiwan
```

## Auth setup

1. Register at [tdx.transportdata.tw](https://tdx.transportdata.tw/register).
2. Go to **會員中心 → 資料服務 → API金鑰** (Member Center → Data Services → API Keys) and copy
   your **Client Id** and **Client Secret**.
3. Keep them out of source control, e.g. in a `.env` file (see [`.env.example`](.env.example)):

   ```sh
   TDX_CLIENT_ID=your-client-id
   TDX_CLIENT_SECRET=your-client-secret
   ```

The client exchanges these for an access token on the first request, caches it in memory,
refreshes it 60 seconds before it expires, and makes sure concurrent requests share a single
token request.

## Quick start

```ts
import { TdxClient } from 'tdx-taiwan';

const tdx = new TdxClient({
  clientId: process.env.TDX_CLIENT_ID!,
  clientSecret: process.env.TDX_CLIENT_SECRET!,
});

const bikes = await tdx.bike.availability('Taipei');
console.log(bikes[0]?.StationUID, bikes[0]?.AvailableRentBikes);

const eta = await tdx.bus.eta('Taipei', '307');
for (const stop of eta) {
  const minutes = stop.EstimateTime == null ? '—' : Math.round(stop.EstimateTime / 60);
  console.log(stop.StopName?.Zh_tw, minutes);
}
```

Runnable scripts are in [`examples/`](examples/):

```sh
cp .env.example .env   # then fill in your keys
npx tsx examples/nearest-youbike.ts 25.0478 121.5170   # 5 nearest YouBike stations with bikes
npx tsx examples/next-metro-train.ts KRTC R10          # next trains at a metro station
npx tsx examples/thsr-trains.ts 1000 1070              # today's THSR trains with fares
npx tsx examples/tra-trains.ts 1000 4400               # today's TRA trains with fares
npx tsx examples/nearest-parking.ts 25.0478 121.5170   # 5 nearest car parks with free spaces
npx tsx examples/nearest-ev-charger.ts 25.0478 121.5170 Taipei 2  # nearest free CCS2 chargers
npx tsx examples/flight-board.ts TSA departures      # live departure board of an airport
npx tsx examples/road-traffic.ts freeway             # most congested freeway sections and live events
npx tsx examples/ferry-departures.ts TW001           # today's ferry departures from a port
```

## NestJS

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { TdxModule } from 'tdx-taiwan/nestjs';

@Module({
  imports: [TdxModule.forRoot({ clientId, clientSecret, isGlobal: true })],
})
export class AppModule {}
```

Inject `TdxClient` into your services. `forRootAsync` (for `ConfigService`), the explicit
`@Inject(TdxClient)` form and the optional `@nestjs/common` v10–v12 peer dependency are
described in [docs/nestjs.md](https://github.com/amangeldievkuu/tdx-taiwan/blob/main/docs/nestjs.md).

## OData queries

Every endpoint accepts a query builder or a plain object. Field names are type-checked
against the response type.

```ts
import { TdxClient, query, odata, type BikeAvailability } from 'tdx-taiwan';

// Builder: the 10 stations with the most bikes right now
const top = await tdx.bike.availability(
  'Taipei',
  query<BikeAvailability>()
    .filter('ServiceStatus eq 1')
    .filter('AvailableRentBikes gt 0') // multiple filters are combined with `and`
    .select('StationUID', 'AvailableRentBikes', 'AvailableReturnBikes')
    .orderBy('AvailableRentBikes', 'desc')
    .top(10),
);

// Plain object, with a safely quoted string literal
const stops = await tdx.bus.eta('Taipei', '307', {
  filter: `StopName/Zh_tw eq ${odata.str('捷運西門站')}`,
  orderBy: 'StopSequence',
});
```

`$format=JSON` is always added. `$select` limits which fields TDX returns, but the result is
still typed as the full item, so treat unselected fields as absent.

## Resources

Responses keep TDX's original field names (`StationUID`, `AvailableRentBikes`, …) so they match
the [TDX documentation](https://tdx.transportdata.tw/api-service/swagger) and the field names
you use in `$filter`; city names autocomplete but any string is accepted. Each resource page
lists its methods, an example and the places where live data departs from the spec; the rules
they share are in [docs/conventions.md](https://github.com/amangeldievkuu/tdx-taiwan/blob/main/docs/conventions.md).

| Namespace     | Scope                                                             | Docs                                                                                   | Example                                                   |
| ------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `tdx.bike`    | YouBike / Moovo stations and live availability                    | [Public bikes](https://github.com/amangeldievkuu/tdx-taiwan/blob/main/docs/bike.md)    | [`nearest-youbike.ts`](examples/nearest-youbike.ts)       |
| `tdx.bus`     | City and InterCity routes, stops, ETAs and live positions         | [Buses](https://github.com/amangeldievkuu/tdx-taiwan/blob/main/docs/bus.md)            | —                                                         |
| `tdx.metro`   | Stations, lines, live boards, first/last trains, fares, alerts    | [Metro](https://github.com/amangeldievkuu/tdx-taiwan/blob/main/docs/metro.md)          | [`next-metro-train.ts`](examples/next-metro-train.ts)     |
| `tdx.thsr`    | Stations, timetables, fares, seat availability, alerts            | [High speed rail](https://github.com/amangeldievkuu/tdx-taiwan/blob/main/docs/thsr.md) | [`thsr-trains.ts`](examples/thsr-trains.ts)               |
| `tdx.tra`     | Stations, timetables, fares, live boards, train positions, alerts | [Taiwan Railway](https://github.com/amangeldievkuu/tdx-taiwan/blob/main/docs/tra.md)   | [`tra-trains.ts`](examples/tra-trains.ts)                 |
| `tdx.parking` | Car parks and curbside segments with live free spaces             | [Parking](https://github.com/amangeldievkuu/tdx-taiwan/blob/main/docs/parking.md)      | [`nearest-parking.ts`](examples/nearest-parking.ts)       |
| `tdx.ev`      | Stations, chargers, connectors, live status, prices               | [EV charging](https://github.com/amangeldievkuu/tdx-taiwan/blob/main/docs/ev.md)       | [`nearest-ev-charger.ts`](examples/nearest-ev-charger.ts) |
| `tdx.air`     | Airports, airlines, live departure and arrival boards             | [Flights](https://github.com/amangeldievkuu/tdx-taiwan/blob/main/docs/air.md)          | [`flight-board.ts`](examples/flight-board.ts)             |
| `tdx.traffic` | Live section speeds, cameras, signs, detectors, eTag, events      | [Road traffic](https://github.com/amangeldievkuu/tdx-taiwan/blob/main/docs/traffic.md) | [`road-traffic.ts`](examples/road-traffic.ts)             |
| `tdx.ship`    | Ports, routes, timetables, fares, live boards, AIS positions      | [Ferries](https://github.com/amangeldievkuu/tdx-taiwan/blob/main/docs/ship.md)         | [`ferry-departures.ts`](examples/ferry-departures.ts)     |

Sub-APIs follow the same pattern: `tdx.bus.interCity`, `tdx.ev.freeway`, `tdx.traffic.freeway`,
`tdx.traffic.highway` and `tdx.ship.domestic`.

| Method                  | What it does                                                           | Returns           |
| ----------------------- | ---------------------------------------------------------------------- | ----------------- |
| `tdx.get(path, query?)` | Any TDX endpoint not wrapped yet, with auth, retries and rate limiting | `unknown`         |
| `tdx.getAccessToken()`  | The current access token                                               | `Promise<string>` |
| `tdx.clearCache()`      | Empties the response cache                                             | `void`            |

## Options

```ts
new TdxClient({
  clientId: '…',
  clientSecret: '…',
  requestsPerSecond: 5, // client-side rate limit; 0 disables it
  maxRetries: 3, // retries for 429, 5xx and network errors (API and token endpoint)
  timeoutMs: 30_000, // per request, including reading the response body
  cache: false, // true, or { staticTtlMs, realtimeTtlMs, maxEntries }
  baseUrl: 'https://tdx.transportdata.tw/api/basic',
  fetch: globalThis.fetch, // inject a custom fetch (proxies, tests)
  onRequest: ({ url }) => {}, // before every HTTP attempt to the API
  onRetry: ({ url, attempt, status, delayMs }) => {}, // before each backoff wait
});
```

**Hooks.** `onRequest` and `onRetry` are optional observability callbacks, for example for
logging or metrics:

```ts
const tdx = new TdxClient({
  clientId,
  clientSecret,
  onRequest: ({ url }) => logger.debug(`TDX GET ${url}`),
  onRetry: ({ url, attempt, status, delayMs }) =>
    logger.warn(
      `TDX retry #${attempt} in ${delayMs}ms (status ${status ?? 'network error'}): ${url}`,
    ),
});
```

- `onRequest({ url })` runs before every HTTP attempt to the API, including retries. Token
  requests are not reported.
- `onRetry({ url, attempt, status, delayMs })` runs before each backoff wait. `attempt` starts
  at 1, and `status` is `undefined` for network errors and timeouts. Token endpoint outages
  (network errors, 429, 5xx) are retried within the same budget and reported with the API
  `url` and the token endpoint's `status`; 400/401 from the token endpoint (bad credentials)
  are not retried. The one-off token refresh after a 401 is not a retry and is not reported.
- Hooks are called synchronously; an exception thrown by a hook fails the request.

**Rate limits.** API rate limits depend on your TDX subscription plan; see
[TDX pricing](https://tdx.transportdata.tw/pricing) and set `requestsPerSecond` to match. The
token endpoint is separately limited to 20 requests per minute per source IP, according to TDX's
official [sample code documentation](https://github.com/tdxmotc/SampleCode) (linked from the API
Swagger pages). This client requests a token only when its cached one is about to expire. On 429
the client honours `Retry-After` (capped at 30 s) or backs off exponentially with jitter.
TDX also bills usage in points by call count and by response size (per its Swagger pages,
1,500 calls or 150 MB per point), so prefer `$filter` / `$select` on large lists such as city
stops, bus ETAs of busy routes, whole-city live traffic and metro fares, and consider `cache: true`.

**Caching.** With `cache: true`, responses are cached in memory per URL: static data (stations,
routes, timetables, fares, reference lists) for 1 hour and real-time data (availability, ETAs,
live boards, positions, alerts) for 15 seconds. Identical concurrent requests share one HTTP
call, failures are never cached, and every caller receives its own copy of the data.

## Errors

All errors extend `TdxError`:

| Error               | When                                                                                      | Extra fields                        |
| ------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------- |
| `TdxAuthError`      | The token request failed (bad credentials, malformed response, outage after retries)      | `status?`, `body?`, `retryAfterMs?` |
| `TdxApiError`       | TDX returned an error status (after retries) or an unexpected body                        | `status`, `body`, `url`             |
| `TdxRateLimitError` | Still HTTP 429 after all retries (subclass of `TdxApiError`)                              | `retryAfterMs?`                     |
| `TdxNetworkError`   | No complete response (DNS, connection reset, timeout, interrupted body) after all retries | `url`                               |

```ts
import { TdxApiError, TdxRateLimitError } from 'tdx-taiwan';

try {
  await tdx.bus.eta('Taipei', '307');
} catch (err) {
  if (err instanceof TdxRateLimitError) console.warn('slow down', err.retryAfterMs);
  else if (err instanceof TdxApiError) console.error(err.status, err.body);
  else throw err;
}
```

## Development

```sh
npm install
npm test                  # unit tests (fixtures only, never calls the live API)
npm run test:watch
npm run test:integration  # live API; runs only when TDX_CLIENT_ID / TDX_CLIENT_SECRET are set
npm run lint              # eslint + prettier --check
npm run format
npm run typecheck
npm run build
npm run check:exports     # publint + are-the-types-wrong
npm run example:<name>    # youbike, metro, thsr, tra, parking, ev, flights, traffic, ferry
```

Development tooling requires Node.js 22+; the published package supports Node.js 20+. See
[CONTRIBUTING.md](https://github.com/amangeldievkuu/tdx-taiwan/blob/main/CONTRIBUTING.md) for
how endpoints, fixtures and releases are done.

## 繁體中文

`tdx-taiwan` 是存取交通部 [TDX 運輸資料流通服務](https://tdx.transportdata.tw) 的**非官方** TypeScript SDK（與交通部無隸屬或合作關係），
支援公共自行車（YouBike）站點與即時車位、市區公車與公路客運路線、站序、預估到站時間與即時位置、捷運車站、路線、即時到站看板、首末班車、票價與營運通阻、高鐵與臺鐵時刻表、票價與即時看板、停車場與充電樁即時資訊、機場即時航班看板、即時路況，以及船運航線、班表、票價與港口即時看板。

**安裝**（需要 Node.js 20 以上版本）

```sh
npm install tdx-taiwan
```

**金鑰設定**：註冊 TDX 會員後，至「會員中心 → 資料服務 → API金鑰」取得 Client Id 與 Client
Secret，放在 `.env`（請勿提交至版本控制）：

```sh
TDX_CLIENT_ID=你的-client-id
TDX_CLIENT_SECRET=你的-client-secret
```

**使用範例**

```ts
import { TdxClient, query, type BikeAvailability } from 'tdx-taiwan';

const tdx = new TdxClient({
  clientId: process.env.TDX_CLIENT_ID!,
  clientSecret: process.env.TDX_CLIENT_SECRET!,
});

const bikes = await tdx.bike.availability('Taipei'); // 臺北市 YouBike 即時車位
const eta = await tdx.bus.eta('Taipei', '307'); // 307 公車預估到站

// OData 查詢：可借車數最多的 10 個站
const top = await tdx.bike.availability(
  'Taipei',
  query<BikeAvailability>()
    .filter('AvailableRentBikes gt 0')
    .orderBy('AvailableRentBikes', 'desc')
    .top(10),
);
```

- 存取權杖（access token）會快取於記憶體，並於到期前 60 秒自動更新；同時多個請求只會發出一次權杖請求。
- 遇到 429、5xx 或網路錯誤會以指數退避（含隨機抖動）重試最多 3 次，並內建用戶端限流（預設每秒 5 次，請依您的 TDX 方案調整）。
- 路線名稱預設以中文名稱（`RouteName/Zh_tw`）完全比對：`tdx.bus.eta('Taipei', '307')` 只回傳 307，不含「307西藏三民」。若要使用 TDX 原本的前綴比對，請傳入 `{ exact: false }`。
- 回應快取：設定 `cache: true` 後，靜態資料（站點、路線、時刻表、票價）快取 1 小時，即時資料（車位、到站、看板、位置）快取 15 秒；可用 `tdx.clearCache()` 清除。
- 觀測鉤子 `onRequest`／`onRetry`，以及 `TdxAuthError`／`TdxApiError`／`TdxRateLimitError`／`TdxNetworkError` 錯誤類別，詳見上方 Options 與 Errors。
- 尚未包裝的端點可用 `tdx.get(path, query?)` 呼叫（同樣套用認證、限流與重試）；`trainDate()` 可將 `Date` 轉為臺灣日期 `YYYY-MM-DD`。
- TDX 依呼叫次數與回應大小計點收費，大量清單請以 `$filter`／`$select` 篩選。
- 回傳資料維持 TDX 原始欄位名稱（如 `StationUID`、`AvailableRentBikes`），型別依官方 OpenAPI 規格定義；實際資料與規格不符之處以實際資料為準，並記載於各資源說明頁。

各資源的方法、範例與資料注意事項見下列說明頁（英文，每頁末附中文摘要）：

- 公共自行車：`tdx.bike.stations('Taipei')`（站點）、`availability`（即時可借／可還車數）。[說明](https://github.com/amangeldievkuu/tdx-taiwan/blob/main/docs/bike.md)
- 公車：`tdx.bus.eta('Taipei', '307')`（預估到站）、`routes`、`stopsOfRoute`、`positions`（即時位置）、`stops`（縣市全部站牌）；公路客運使用 `tdx.bus.interCity.*`。[說明](https://github.com/amangeldievkuu/tdx-taiwan/blob/main/docs/bus.md)
- 捷運：`tdx.metro.liveBoard('TRTC')`（即時到站看板，`EstimateTime` 單位為分鐘）、`stations`、`lines`、`stationsOfLine`、`firstLastTimetable`、`odFare`、`alerts`，以軌道系統代碼查詢。[說明](https://github.com/amangeldievkuu/tdx-taiwan/blob/main/docs/metro.md)
- 高鐵：`tdx.thsr.timetable('1000', '1070', date)`（起迄站時刻表）、`odFare`、`availableSeats`（對號座剩餘座位）、`alerts`。[說明](https://github.com/amangeldievkuu/tdx-taiwan/blob/main/docs/thsr.md)
- 臺鐵（TDX v3）：`tdx.tra.timetable('1000', '4400', date)`、`stations`、`odFare`（依車種及行駛方向）、`liveBoard`、`trainLiveBoard`、`alerts`。[說明](https://github.com/amangeldievkuu/tdx-taiwan/blob/main/docs/tra.md)
- 停車：`tdx.parking.carParks('Taipei')`、`availability`（即時剩餘車位）、`segments`、`segmentAvailability`。[說明](https://github.com/amangeldievkuu/tdx-taiwan/blob/main/docs/parking.md)
- 電動車充電：`tdx.ev.stations('Taipei')`、`chargingPoints`、`connectors`、`liveStatus`（充電槍即時狀態）、`chargingRates`；高速公路服務區使用 `tdx.ev.freeway.*`。[說明](https://github.com/amangeldievkuu/tdx-taiwan/blob/main/docs/ev.md)
- 航空：`tdx.air.departures('TSA')`／`arrivals`（機場即時航班看板）、`flights`、`boards`、`airports`／`airport`、`airlines`／`airline`。[說明](https://github.com/amangeldievkuu/tdx-taiwan/blob/main/docs/air.md)
- 路況：`tdx.traffic.liveTraffic('Taipei')`（路段即時速率與壅塞程度）、`sections`、`congestionLevels`、`cctvs`、`vds`／`vdLive`、`etagPairs`／`etagPairLive`、`news`、`events`／`liveEvents`；國道 `tdx.traffic.freeway.*`、省道 `tdx.traffic.highway.*`。[說明](https://github.com/amangeldievkuu/tdx-taiwan/blob/main/docs/traffic.md)
- 航運：`tdx.ship.liveBoard()`（港口即時出發／抵達看板）、`routes`、`ports`、`dailySchedule(routeId?)`、`odFare`／`odFareBetween`、`livePosition`（AIS 船位）、`alerts` 等；縣市藍色公路使用 `tdx.ship.domestic.*`。[說明](https://github.com/amangeldievkuu/tdx-taiwan/blob/main/docs/ship.md)
- 資料來源與授權：資料由交通部運輸資料流通服務平臺提供，並適用其[資料授權利用條款](https://tdx.transportdata.tw/term)。公開發布或展示資料（含加值衍生物）時，須清楚標示資料來源為「交通部運輸資料流通服務平臺」或其資料來源單位；資料可能依平臺收費要點有償提供。
- NestJS 使用者可匯入 `tdx-taiwan/nestjs` 的 `TdxModule.forRoot()` / `forRootAsync()`，詳見 [docs/nestjs.md](https://github.com/amangeldievkuu/tdx-taiwan/blob/main/docs/nestjs.md)。

## Data source and terms

This is an **unofficial** SDK. It is not affiliated with, or endorsed by, the Ministry of
Transportation and Communications (MOTC, 交通部); "TDX" refers to MOTC's Transport Data
eXchange platform.

The data comes from TDX and is governed by its
[資料授權利用條款 (data license terms)](https://tdx.transportdata.tw/term), not by this
package's license. In particular:

- When you publish or display TDX data, or a product built from it, you must clearly credit the
  source as **「交通部運輸資料流通服務平臺」** (MOTC Transport Data eXchange) or the original data
  provider. Without that credit the terms treat the data as never licensed to you.
- The license covers reproducing, distributing and building on the data, but not MOTC's
  trademarks or patents.
- Data may be charged for under the platform's pricing rules, and you must follow the usage
  rules it publishes (such as rate limits for your plan).

## License

The SDK code is [MIT](LICENSE) licensed. TDX data, including the trimmed responses in
`tests/fixtures/`, remains under the TDX terms above.
