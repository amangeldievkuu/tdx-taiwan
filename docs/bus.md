# Buses (`tdx.bus`)

City buses (市區公車) by city and InterCity coaches (公路客運) under `tdx.bus.interCity`: routes,
ordered stops, estimated arrivals, live positions and the city stop list.

Route names are matched exactly against the Chinese name (`RouteName/Zh_tw`). TDX itself
treats the `{RouteName}` path segment as a prefix, so `'307'` would also return `307西藏三民`
and `'紅5'` would also return `紅50`, `紅55`, …; the SDK adds an exact `$filter` for you. Pass
`exact: false` (plain-object queries only) to get TDX's prefix matching instead:

```ts
await tdx.bus.eta('Taipei', '307'); // route 307 only
await tdx.bus.eta('Taipei', '307', { exact: false }); // 307, 307西藏三民, …
```

Names that contain `/` (a few Kinmen routes, such as `15A往烈嶼 (后頭進/黃厝出)`) work too.

## Methods

| Method                                              | TDX endpoint                                                 | Returns                       |
| --------------------------------------------------- | ------------------------------------------------------------ | ----------------------------- |
| `tdx.bus.routes(city, routeName?, query?)`          | `GET /v2/Bus/Route/City/{City}[/{RouteName}]`                | `BusRoute[]`                  |
| `tdx.bus.stopsOfRoute(city, routeName, query?)`     | `GET /v2/Bus/StopOfRoute/City/{City}/{RouteName}`            | `BusStopOfRoute[]`            |
| `tdx.bus.eta(city, routeName, query?)`              | `GET /v2/Bus/EstimatedTimeOfArrival/City/{City}/{RouteName}` | `BusEstimatedTimeOfArrival[]` |
| `tdx.bus.stops(city, query?)`                       | `GET /v2/Bus/Stop/City/{City}`                               | `BusStopInfo[]`               |
| `tdx.bus.positions(city, routeName, query?)`        | `GET /v2/Bus/RealTimeByFrequency/City/{City}/{RouteName}`    | `BusPosition[]`               |
| `tdx.bus.interCity.routes(routeName?, query?)`      | `GET /v2/Bus/Route/InterCity[/{RouteName}]`                  | `BusRoute[]`                  |
| `tdx.bus.interCity.stopsOfRoute(routeName, query?)` | `GET /v2/Bus/StopOfRoute/InterCity/{RouteName}`              | `BusStopOfRoute[]`            |
| `tdx.bus.interCity.eta(routeName, query?)`          | `GET /v2/Bus/EstimatedTimeOfArrival/InterCity/{RouteName}`   | `BusEstimatedTimeOfArrival[]` |
| `tdx.bus.interCity.positions(routeName, query?)`    | `GET /v2/Bus/RealTimeByFrequency/InterCity/{RouteName}`      | `BusPosition[]`               |

## Example

```ts
// Where are the route 307 buses right now?
const buses = await tdx.bus.positions('Taipei', '307');
for (const b of buses) {
  console.log(
    b.PlateNumb,
    b.BusPosition?.PositionLat,
    b.BusPosition?.PositionLon,
    `${b.Speed} km/h`,
  );
}

// InterCity coaches (公路客運) have the same methods without a city
const coaches = await tdx.bus.interCity.eta('1610');
const where = await tdx.bus.interCity.positions('1610');
```

## Notes

- `positions` and every `interCity` method match route names exactly, like the city methods:
  TDX would return all 91 `9xxx` coach routes for `'9'`. Pass `{ exact: false }` to opt out.
- `interCity` returns the same types as the city methods (`BusRoute`, `BusStopOfRoute`,
  `BusEstimatedTimeOfArrival`).
- `stops(city)` returns every stop in a city as `BusStopInfo` (about 29,000 for Taipei), so
  narrow it with `$filter` / `$select`. `BusStop` remains the stop type inside
  `BusStopOfRoute`. `StationGroupID` is optional because Taipei and Kaohsiung omit it.

## See also

- [Conventions](./conventions.md) — cities, route names, large lists
- [Metro](./metro.md) — metro `EstimateTime` is in minutes, bus `eta` in seconds

## 繁體中文

公車：`tdx.bus.positions('Taipei', '307')` 取得公車即時位置（A1）、`tdx.bus.stops('Taipei')` 取得縣市全部站牌（資料量大，建議篩選）；公路客運使用 `tdx.bus.interCity.routes('1610')`、`eta`、`positions` 等，路線名稱同樣預設完全比對。捷運另有 `tdx.metro.alerts('TRTC')` 營運通阻資料。
