# Buses (`tdx.bus`)

City buses (市區公車) by city and InterCity coaches (公路客運) under `tdx.bus.interCity`: routes,
ordered stops, estimated arrivals, live positions and arrivals at stops, schedules, first and
last trips, fares, route shapes, operators, the vehicle fleet and the city stop list.

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

| Method                                                  | TDX endpoint                                                   | Returns                       |
| ------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------- |
| `tdx.bus.routes(city, routeName?, query?)`              | `GET /v2/Bus/Route/City/{City}[/{RouteName}]`                  | `BusRoute[]`                  |
| `tdx.bus.stopsOfRoute(city, routeName, query?)`         | `GET /v2/Bus/StopOfRoute/City/{City}/{RouteName}`              | `BusStopOfRoute[]`            |
| `tdx.bus.eta(city, routeName?, query?)`                 | `GET /v2/Bus/EstimatedTimeOfArrival/City/{City}[/{RouteName}]` | `BusEstimatedTimeOfArrival[]` |
| `tdx.bus.schedule(city, routeName?, query?)`            | `GET /v2/Bus/Schedule/City/{City}[/{RouteName}]`               | `BusSchedule[]`               |
| `tdx.bus.alerts(city, query?)`                          | `GET /v2/Bus/Alert/City/{City}`                                | `BusAlert[]`                  |
| `tdx.bus.news(city, query?)`                            | `GET /v2/Bus/News/City/{City}`                                 | `BusNews[]`                   |
| `tdx.bus.stops(city, query?)`                           | `GET /v2/Bus/Stop/City/{City}`                                 | `BusStopInfo[]`               |
| `tdx.bus.stations(city, query?)`                        | `GET /v2/Bus/Station/City/{City}`                              | `BusStation[]`                |
| `tdx.bus.positions(city, routeName, query?)`            | `GET /v2/Bus/RealTimeByFrequency/City/{City}/{RouteName}`      | `BusPosition[]`               |
| `tdx.bus.nearStop(city, routeName?, query?)`            | `GET /v2/Bus/RealTimeNearStop/City/{City}[/{RouteName}]`       | `BusNearStop[]`               |
| `tdx.bus.firstLastTrips(city, routeName?, query?)`      | `GET /v2/Bus/FirstLastTripInfo/City/{City}[/{RouteName}]`      | `BusFirstLastTripInfo[]`      |
| `tdx.bus.fares(city, routeName?, query?)`               | `GET /v2/Bus/RouteFare/City/{City}[/{RouteName}]`              | `BusRouteFare[]`              |
| `tdx.bus.shapes(city, routeName?, query?)`              | `GET /v2/Bus/Shape/City/{City}[/{RouteName}]`                  | `BusShape[]`                  |
| `tdx.bus.displayStopsOfRoute(city, routeName?, query?)` | `GET /v2/Bus/DisplayStopOfRoute/City/{City}[/{RouteName}]`     | `BusDisplayStopOfRoute[]`     |
| `tdx.bus.operators(city, query?)`                       | `GET /v2/Bus/Operator/City/{City}`                             | `BusOperator[]`               |
| `tdx.bus.vehicles(city, query?)`                        | `GET /v2/Bus/Vehicle/City/{City}`                              | `BusVehicle[]`                |
| `tdx.bus.interCity.routes(routeName?, query?)`          | `GET /v2/Bus/Route/InterCity[/{RouteName}]`                    | `BusRoute[]`                  |
| `tdx.bus.interCity.stopsOfRoute(routeName, query?)`     | `GET /v2/Bus/StopOfRoute/InterCity/{RouteName}`                | `BusStopOfRoute[]`            |
| `tdx.bus.interCity.eta(routeName?, query?)`             | `GET /v2/Bus/EstimatedTimeOfArrival/InterCity[/{RouteName}]`   | `BusEstimatedTimeOfArrival[]` |
| `tdx.bus.interCity.schedule(routeName?, query?)`        | `GET /v2/Bus/Schedule/InterCity[/{RouteName}]`                 | `BusSchedule[]`               |
| `tdx.bus.interCity.alerts(query?)`                      | `GET /v2/Bus/Alert/InterCity`                                  | `BusAlert[]`                  |
| `tdx.bus.interCity.news(query?)`                        | `GET /v2/Bus/News/InterCity`                                   | `BusNews[]`                   |
| `tdx.bus.interCity.positions(routeName, query?)`        | `GET /v2/Bus/RealTimeByFrequency/InterCity/{RouteName}`        | `BusPosition[]`               |
| `tdx.bus.interCity.stations(query?)`                    | `GET /v2/Bus/Station/InterCity`                                | `BusStation[]`                |
| `tdx.bus.interCity.nearStop(routeName?, query?)`        | `GET /v2/Bus/RealTimeNearStop/InterCity[/{RouteName}]`         | `BusNearStop[]`               |
| `tdx.bus.interCity.firstLastTrips(query?)`              | `GET /v2/Bus/FirstLastTripInfo/InterCity`                      | `BusFirstLastTripInfo[]`      |
| `tdx.bus.interCity.fares(routeName?, query?)`           | `GET /v2/Bus/RouteFare/InterCity[/{RouteName}]`                | `BusRouteFare[]`              |
| `tdx.bus.interCity.shapes(routeName?, query?)`          | `GET /v2/Bus/Shape/InterCity[/{RouteName}]`                    | `BusShape[]`                  |
| `tdx.bus.interCity.operators(query?)`                   | `GET /v2/Bus/Operator/InterCity`                               | `BusOperator[]`               |

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

// The bus stations within 300 m of Taipei Main Station, and the routes that stop at each
const near = { lat: 25.0478, lon: 121.517, meters: 300 };
const [cityStations, coachStations] = await Promise.all([
  tdx.bus.stations('Taipei', { nearby: near }),
  tdx.bus.interCity.stations({ nearby: near }),
]);
for (const s of [...cityStations, ...coachStations]) {
  console.log(
    s.StationName.Zh_tw,
    s.Bearing,
    s.Stops?.map((stop) => stop.RouteName.Zh_tw),
  );
}

// Every bus due at one stop, all routes in one call: eta without a route name, filtered on
// the stops of a station (the stop UIDs come from `stations`)
const atStop = await tdx.bus.eta('Taipei', {
  filter: cityStations[0]?.Stops?.map((s) => `StopUID eq '${s.StopUID}'`).join(' or '),
});

// The timetable or headways of route 307, and current detours
const [schedule, alerts] = await Promise.all([
  tdx.bus.schedule('Taipei', '307'),
  tdx.bus.alerts('Taipei'),
]);

// InterCity coaches (公路客運) have the same methods without a city
const coaches = await tdx.bus.interCity.eta('1610');
const where = await tdx.bus.interCity.positions('1610');

// The adult single fare of route 307, and the first and last buses of Taichung route 300
const [fare] = await tdx.bus.fares('Taipei', '307');
const adult = fare?.SectionFares?.[0]?.Fares.find((f) => f.TicketType === 1 && f.FareClass === 1);
const [trips] = await tdx.bus.firstLastTrips('Taichung', '300');
console.log(
  adult?.Price,
  trips?.FirstLastTrips.map((t) => [t.FirstTripDepTime, t.LastTripDepTime]),
);

// Which route 307 buses are low-floor? Join live positions to the fleet on PlateNumb
const [vehicles, buses307] = await Promise.all([
  tdx.bus.vehicles('Taipei'),
  tdx.bus.positions('Taipei', '307'),
]);
const lowFloor = new Set(vehicles.filter((v) => v.IsLowFloor === 1).map((v) => v.PlateNumb));
console.log(buses307.filter((b) => lowFloor.has(b.PlateNumb)).map((b) => b.PlateNumb));
```

## Notes

- `eta(city)` without a route name lists every route at every stop of the city, which is
  large; filter it on `StopUID` (or `RouteName/Zh_tw`) as above. `interCity.eta()` works the
  same way for coaches.
- `schedule` gives each sub-route and direction either fixed trips (`Timetables`, each with every
  stop's time and a `ServiceDay` week pattern) or headway bands (`Frequencys`, the spec's
  spelling); Taipei route 307 has only bands, coach 1610 only trips. Kaohsiung publishes no
  schedules (an empty list). `ServiceDay.NationalHolidays` is never sent.
- `alerts` carry what they affect in `Scope` (operators, stops with their `StationID`, routes);
  `Cause` and `Effect` are codes listed on `BusAlertCause` and `BusAlertEffect`. Taipei's news
  sends `ContactPhone: ""`; Kaohsiung publishes alerts but no news.

- `stations(city)` lists the city's stations: one place where buses stop in one direction, with
  the stop of each route that serves it in `Stops` (route names included). The whole list is
  large; pass `nearby` (TDX's `$spatialFilter`, see
  [Conventions](./conventions.md#large-lists-billing-and-caching)) for the stations around a
  point. Station names are Chinese only (the stops carry English names), `StationAddress` is
  missing for Kaohsiung and `StationGroupID`, required by the spec, comes only with InterCity
  stations.

- `positions` and every `interCity` method match route names exactly, like the city methods:
  TDX would return all 91 `9xxx` coach routes for `'9'`. Pass `{ exact: false }` to opt out.
- `interCity` returns the same types as the city methods (`BusRoute`, `BusStopOfRoute`,
  `BusEstimatedTimeOfArrival`).
- `stops(city)` returns every stop in a city as `BusStopInfo` (about 29,000 for Taipei), so
  narrow it with `$filter` / `$select`. `BusStop` remains the stop type inside
  `BusStopOfRoute`. `StationGroupID` is optional because Taipei and Kaohsiung omit it.

- `nearStop` (A2) has one record per vehicle at the last stop it reached or left
  (`A2EventType` 0 = left, 1 = arrived), where `positions` (A1) has its GPS position. City
  feeds send `SrcUpdateTime`, InterCity feeds `SrcTransTime` and `MessageType`.
- `fares` is the one bus endpoint whose `RouteName` and `SubRouteName` are plain strings, so
  the exact match filters on `RouteName` (`'307'` drops `307西藏三民`). Which list is filled
  depends on `FarePricingType`: `SectionFares` (0, per section, with `BufferZones`), `ODFares`
  (1) or `StageFares` (2, typical of coaches: a long list, one entry per pair of fare stages).
  `TicketType` and `FareClass` are codes listed on `BusTicketType` and `BusFareClass`; a
  `Price` of `-1` means the ticket is not sold.
- `firstLastTrips` gives each sub-route's first and last departure per day pattern. Taipei,
  NewTaipei and Tainan do not publish it (TDX answers 400), and `interCity.firstLastTrips` has no
  per-route path, so filter it on `RouteName/Zh_tw`.
- `shapes` returns `Geometry` as well-known text (`LINESTRING (…)`) and an `EncodedPolyline`.
  Taipei sends one shape per direction without a sub-route (`SubRouteUID` missing,
  `SubRouteName: {}`); coach shapes are per sub-route and long.
- `displayStopsOfRoute` lists the stops of each direction as shown on route maps, without
  sub-routes; Taipei omits `StationGroupID`. It has no InterCity variant.
- `vehicles` is published only by Taipei, NewTaipei, Taoyuan, Taichung, Tainan and Kaohsiung;
  join it to `positions` or `nearStop` on `PlateNumb`. The flags are `0`/`1`, `HasWifi` also
  `-1` (not set).
- `operators` and `interCity.operators` return `BusOperator`; some coach operators have
  `OperatorCode: ""`.

## See also

- [`examples/bus-arrivals.ts`](../examples/bus-arrivals.ts) — `npx tsx examples/bus-arrivals.ts 25.0478 121.5170` (buses due at the nearest bus station)

- [Conventions](./conventions.md) — cities, route names, large lists
- [Metro](./metro.md) — metro `EstimateTime` is in minutes, bus `eta` in seconds

## 繁體中文

公車：`tdx.bus.positions('Taipei', '307')` 取得公車即時位置（A1）、`tdx.bus.stops('Taipei')` 取得縣市全部站牌（資料量大，建議篩選）、`tdx.bus.stations('Taipei', { nearby: { lat, lon, meters } })` 取得指定位置附近的站位與停靠路線、`tdx.bus.eta('Taipei', { filter: "StopUID eq '…'" })` 不指定路線即可取得單一站牌所有路線的預估到站、`schedule`（班表或班距）、`alerts`（通阻）與 `news`；公路客運使用 `tdx.bus.interCity.routes('1610')`、`eta`、`positions` 等，路線名稱同樣預設完全比對。另有 `nearStop`（定點到離站 A2）、`fares`（票價，路線名稱為純字串）、`firstLastTrips`（首末班車，臺北市、新北市、臺南市未提供）、`shapes`（WKT 線型）、`displayStopsOfRoute`（顯示用站序）、`operators`（業者）與 `vehicles`（車輛，可依 `PlateNumb` 對應即時位置）。捷運另有 `tdx.metro.alerts('TRTC')` 營運通阻資料。
