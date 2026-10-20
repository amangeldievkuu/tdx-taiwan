# tdx-taiwan

TypeScript SDK for Taiwan's [TDX (Transport Data eXchange)](https://tdx.transportdata.tw) API
— YouBike availability, bus routes and arrival estimates, and metro stations, live boards,
timetables and fares.

- OAuth2 client-credentials auth with in-memory token caching and automatic refresh
- Retries with exponential backoff + jitter on 429 / 5xx, and a client-side rate limiter
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

## Examples

### 1. Plain Node.js

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

A runnable script that prints the 5 nearest YouBike stations with bikes available is in
[`examples/nearest-youbike.ts`](examples/nearest-youbike.ts):

```sh
cp .env.example .env   # then fill in your keys
npx tsx examples/nearest-youbike.ts 25.0478 121.5170
```

### 2. NestJS

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TdxModule } from 'tdx-taiwan/nestjs';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TdxModule.forRootAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        clientId: config.getOrThrow('TDX_CLIENT_ID'),
        clientSecret: config.getOrThrow('TDX_CLIENT_SECRET'),
        cache: true,
      }),
    }),
  ],
})
export class AppModule {}
```

```ts
// bus.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { TdxClient } from 'tdx-taiwan';

@Injectable()
export class BusService {
  // Explicit @Inject works even when your build does not emit decorator metadata
  // (esbuild, SWC without metadata, Vitest).
  constructor(@Inject(TdxClient) private readonly tdx: TdxClient) {}

  arrivals(route: string) {
    return this.tdx.bus.eta('Taipei', route);
  }
}
```

`TdxModule.forRoot({ clientId, clientSecret, isGlobal })` is also available for static
configuration. `@nestjs/common` (v10–v12) is an optional peer dependency — the core package
never loads it.

### 3. OData queries

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

## API

| Method                                          | TDX endpoint                                                 | Returns                       |
| ----------------------------------------------- | ------------------------------------------------------------ | ----------------------------- |
| `tdx.bike.stations(city, query?)`               | `GET /v2/Bike/Station/City/{City}`                           | `BikeStation[]`               |
| `tdx.bike.availability(city, query?)`           | `GET /v2/Bike/Availability/City/{City}`                      | `BikeAvailability[]`          |
| `tdx.bus.routes(city, routeName?, query?)`      | `GET /v2/Bus/Route/City/{City}[/{RouteName}]`                | `BusRoute[]`                  |
| `tdx.bus.stopsOfRoute(city, routeName, query?)` | `GET /v2/Bus/StopOfRoute/City/{City}/{RouteName}`            | `BusStopOfRoute[]`            |
| `tdx.bus.eta(city, routeName, query?)`          | `GET /v2/Bus/EstimatedTimeOfArrival/City/{City}/{RouteName}` | `BusEstimatedTimeOfArrival[]` |
| `tdx.metro.stations(system, query?)`            | `GET /v2/Rail/Metro/Station/{RailSystem}`                    | `MetroStation[]`              |
| `tdx.metro.lines(system, query?)`               | `GET /v2/Rail/Metro/Line/{RailSystem}`                       | `MetroLine[]`                 |
| `tdx.metro.stationsOfLine(system, query?)`      | `GET /v2/Rail/Metro/StationOfLine/{RailSystem}`              | `MetroStationOfLine[]`        |
| `tdx.metro.liveBoard(system, query?)`           | `GET /v2/Rail/Metro/LiveBoard/{RailSystem}`                  | `MetroLiveBoard[]`            |
| `tdx.metro.firstLastTimetable(system, query?)`  | `GET /v2/Rail/Metro/FirstLastTimetable/{RailSystem}`         | `MetroFirstLastTimetable[]`   |
| `tdx.metro.odFare(system, query?)`              | `GET /v2/Rail/Metro/ODFare/{RailSystem}`                     | `MetroODFare[]`               |
| `tdx.get(path, query?)`                         | Any other TDX endpoint (auth, retries, rate limit applied)   | `unknown`                     |
| `tdx.getAccessToken()`                          | The current access token                                     | `string`                      |
| `tdx.clearCache()`                              | Empties the response cache                                   | `void`                        |

Responses keep TDX's original field names (`StationUID`, `AvailableRentBikes`, …) so they
match the [TDX documentation](https://tdx.transportdata.tw/api-service/swagger) and the field
names you use in `$filter`. Fields are optional or nullable exactly as the OpenAPI spec
declares them.

City names autocomplete (`'Taipei'`, `'NewTaipei'`, `'Kaohsiung'`, …) but any string is
accepted. Route names may be Chinese (`'紅5'`); they are URL-encoded for you.

Route names are matched exactly against the Chinese name (`RouteName/Zh_tw`). TDX itself
treats the `{RouteName}` path segment as a prefix, so `'307'` would also return `307西藏三民`
and `'紅5'` would also return `紅50`, `紅55`, …; the SDK adds an exact `$filter` for you. Pass
`exact: false` (plain-object queries only) to get TDX's prefix matching instead:

```ts
await tdx.bus.eta('Taipei', '307'); // route 307 only
await tdx.bus.eta('Taipei', '307', { exact: false }); // 307, 307西藏三民, …
```

Names that contain `/` (a few Kinmen routes, such as `15A往烈嶼 (后頭進/黃厝出)`) work too.

### Metro

Metro methods take a rail system code: `TRTC` 臺北捷運, `KRTC` 高雄捷運, `TYMC` 桃園捷運,
`TMRT` 臺中捷運, `KLRT` 高雄輕軌, `NTDLRT` 淡海輕軌, `TRTCMG` 貓空纜車, `NTMC` 新北捷運,
`NTALRT` 安坑輕軌.

```ts
// Next trains at Formosa Boulevard (美麗島, R10) in Kaohsiung
const board = await tdx.metro.liveBoard('KRTC', { filter: "StationID eq 'R10'" });
for (const b of board) console.log(b.TripHeadSign, b.EstimateTime, 'min');

// Adult single-journey fare from Taipei Main Station to Dingpu
const [od] = await tdx.metro.odFare('TRTC', {
  filter: ["OriginStationID eq 'BL12'", "DestinationStationID eq 'BL01'"],
});
const adult = od?.Fares.find((f) => f.TicketType === 1 && f.FareClass === 1);
console.log(adult?.Price); // 40
```

- `liveBoard` `EstimateTime` is in **minutes**; bus `eta` `EstimateTime` is in seconds.
- `liveBoard` only supports `TRTC`, `KRTC`, `TYMC` and `KLRT`; other systems get a
  `TdxApiError` (400). KRTC, TYMC and KLRT list the next train for every station. TRTC only
  lists trains arriving right now (`EstimateTime` is always `0`), so most Taipei stations are
  absent at any given moment.
- `odFare` returns every station pair (about 15,000 for TRTC), so filter on
  `OriginStationID` / `DestinationStationID`.
- Where live data departs from the spec, the types follow the data: `StationAddress` and
  `LineColor` are optional, and `LineSectionName` is often `{}`.

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

**Caching.** With `cache: true`, responses are cached in memory per URL: static data (bike
stations, bus routes, stops of route) for 1 hour and real-time data (bike availability, bus ETA)
for 15 seconds. Identical concurrent requests share one HTTP call, failures are never cached, and
every caller receives its own copy of the data.

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
npm run test:integration  # live API; runs only when TDX_CLIENT_ID / TDX_CLIENT_SECRET are set
npm run lint
npm run build
npm run check:exports     # publint + are-the-types-wrong
```

Development tooling requires Node.js 22+; the published package supports Node.js 20+.

## 繁體中文

`tdx-taiwan` 是交通部 [TDX 運輸資料流通服務](https://tdx.transportdata.tw) 的 TypeScript SDK，
支援公共自行車（YouBike）站點與即時車位、市區公車路線、站序與預估到站時間，以及捷運車站、路線、即時到站看板、首末班車與票價。

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
- 遇到 429 或 5xx 會以指數退避（含隨機抖動）重試最多 3 次，並內建用戶端限流（預設每秒 5 次，請依您的 TDX 方案調整）。
- 路線名稱預設以中文名稱（`RouteName/Zh_tw`）完全比對：`tdx.bus.eta('Taipei', '307')` 只回傳 307，不含「307西藏三民」。若要使用 TDX 原本的前綴比對，請傳入 `{ exact: false }`。
- 捷運：`tdx.metro.liveBoard('TRTC')` 等方法以軌道系統代碼（`TRTC`、`KRTC`、`TYMC`…）查詢。注意捷運看板的 `EstimateTime` 單位為**分鐘**（公車為秒），且臺北捷運（TRTC）看板只列出即將進站（0 分鐘）的列車；`odFare` 資料量大，建議以 `OriginStationID`／`DestinationStationID` 篩選。
- 回傳資料維持 TDX 原始欄位名稱（如 `StationUID`、`AvailableRentBikes`），型別依官方 OpenAPI 規格定義。
- NestJS 使用者可匯入 `tdx-taiwan/nestjs` 的 `TdxModule.forRoot()` / `forRootAsync()`（範例見上方英文說明）。

## License

[MIT](LICENSE)

This project is not affiliated with the Ministry of Transportation and Communications (MOTC).
Data is provided by TDX under its own terms of use.
