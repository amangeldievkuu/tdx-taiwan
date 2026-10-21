# Ferries (`tdx.ship`)

Ports, routes, operators, vessels, stop sequences, fares, regular and daily timetables, live
departure and arrival boards per port, AIS positions, seat availability, alerts and news, from
the 航港局 nationwide feed (outlying islands, cross-strait, 小三通) and from the county and city
blue-highway feeds under `tdx.ship.domestic`.

## Methods

| Method                                       | TDX endpoint                                                                                                                                          | Returns                  |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `tdx.ship.ports(query?)`                     | `GET /v3/Ship/Port`                                                                                                                                   | `ShipPorts`              |
| `tdx.ship.routes(query?)`                    | `GET /v3/Ship/Route`                                                                                                                                  | `ShipRoutes`             |
| `tdx.ship.operators(query?)`                 | `GET /v3/Ship/Operator`                                                                                                                               | `ShipOperators`          |
| `tdx.ship.vessels(query?)`                   | `GET /v3/Ship/Vessel`                                                                                                                                 | `ShipVessels`            |
| `tdx.ship.stopsOfRoute(query?)`              | `GET /v3/Ship/StopOfRoute`                                                                                                                            | `ShipStopOfRoutes`       |
| `tdx.ship.odFare(query?)`                    | `GET /v3/Ship/ODFare`                                                                                                                                 | `ShipRouteFares`         |
| `tdx.ship.odFareBetween(from, to, query?)`   | `GET /v3/Ship/ODFare/{O}/to/{D}`                                                                                                                      | `ShipRouteFare[]`        |
| `tdx.ship.generalSchedule(routeId?, query?)` | `GET /v3/Ship/GeneralSchedule[/{RouteID}]`                                                                                                            | `ShipGeneralSchedules`   |
| `tdx.ship.dailySchedule(routeId?, query?)`   | `GET /v3/Ship/DailySchedule[/{RouteID}]`                                                                                                              | `ShipDailySchedules`     |
| `tdx.ship.liveBoard(query?)`                 | `GET /v3/Ship/ShipLiveBoard`                                                                                                                          | `ShipLiveBoards`         |
| `tdx.ship.livePosition(query?)`              | `GET /v3/Ship/LivePosition`                                                                                                                           | `ShipLivePositions`      |
| `tdx.ship.seatAvailability(query?)`          | `GET /v3/Ship/SeatAvailability`                                                                                                                       | `ShipSeatAvailabilities` |
| `tdx.ship.alerts(query?)`                    | `GET /v3/Ship/Alert`                                                                                                                                  | `ShipAlerts`             |
| `tdx.ship.news(query?)`                      | `GET /v3/Ship/News`                                                                                                                                   | `ShipNewsList`           |
| `tdx.ship.authorities(query?)`               | `GET /v3/Ship/Authority`                                                                                                                              | `ShipAuthorities`        |
| `tdx.ship.domestic.*(city, query?)`          | The city feeds at `…/Domestic/City/{City}`: routes, operators, vessels, stopsOfRoute, odFare, generalSchedule, dailySchedule, liveBoard, alerts, news | same types               |

## Example

```ts
import { trainDate } from 'tdx-taiwan';

// Today's departures from 小琉球白沙港, with route names
const [{ ShipLiveBoardses: boards }, { Routes: routes }] = await Promise.all([
  tdx.ship.liveBoard({ filter: "PortID eq 'TW001'" }),
  tdx.ship.routes(),
]);
const routeName = new Map(routes.map((r) => [r.RouteID, r.RouteName.Zh_tw]));
for (const d of boards[0]?.DepartureLiveBoards ?? []) {
  console.log(d.ScheduledDepartureTime, routeName.get(d.RouteID ?? ''), d.DepartureRemark);
}

// Tomorrow's timetable of one route, and the fares between two ports
const tomorrow = new Date(Date.now() + 86_400_000);
const { DailySchedules: days } = await tdx.ship.dailySchedule('FGGI', {
  filter: `Date eq '${trainDate(tomorrow)}'`,
});
const fares = await tdx.ship.odFareBetween('TWKEL', 'TW007'); // Keelung → Nangan

// Penghu's inter-island lines are published by the county, not the nationwide feed
const { Routes: penghu } = await tdx.ship.domestic.routes('PenghuCounty');
```

## Notes

- Every response is a wrapper object named per kind (`Ports`, `Routes`, `Operators`, `Vessels`,
  `StopOfRoutes`, `RouteFares`, `GeneralSchedules`, `DailySchedules`, `ShipLiveBoardses` (sic),
  `LivePositions`, `SeatAvailabilities`, `Alerts`, `Newses`, `Authorities`); `Count` is never
  sent and static wrappers carry `VersionID`. Queries apply to the items. `odFareBetween` is the
  one plain-array endpoint.
- Fares list `TicketType` and `FareClass` codes; live data uses `FareClass: 254` (其他, e.g. an
  insurance-only ticket) beyond the spec's 1-9, so the field is a plain number.
- **The city feeds are separate data.** `tdx.ship.domestic.routes(city)` returns routes run by
  that county or city (Penghu 11, Kaohsiung 10, NewTaipei 5, Taipei 2, Kinmen 2) with their own
  IDs (`2048`, `KHH005`, `ZH101`), none of which are in the nationwide list; Lienchiang,
  Pingtung, Taitung and Nantou answer empty wrappers. Routes, operators, vessels, stops, fares,
  schedules, alerts and news accept Taipei, NewTaipei, Kaohsiung, NantouCounty, PingtungCounty,
  TaitungCounty, KinmenCounty, PenghuCounty and LienchiangCounty; `domestic.liveBoard` only
  LienchiangCounty. An unsupported city gets a 400 listing the accepted ones (see
  [Conventions](./conventions.md#cities-and-route-names)).
- Timetable times are not zero-padded (`6:15`) and `ArrivalTime` is `""` at the first port;
  nationwide dates are `YYYY-MM-DD`, city dates `YYYY/MM/DD`. `dailySchedule()` without a route
  is about 850 rows and 1.3 MB: pass a route ID.
- Live boards: one element per port (25 ports), names spelt `PortName.ZhTw`; departures carry
  `ScheduledDepartureTime`, `EstimateDepartureTime` and, once sailed, `ActualDepartureTime`, with
  remarks `準時`, `離港`, `已離港`, `取消`, `安檢中` (English in `DepartureRemarkEn`). Some boards
  publish stale scheduled dates (a 2014 date on the Green Island board): use `ShipDate` and the
  time of day.
- Ports never carry `Country` / `CountryCode`; `City` is Chinese (`澎湖縣`) and `CityCode` an
  abbreviation (`PEN`). `livePosition` is AIS data (`MMSI`, `SOG` knots, `COG`, `NAVSTAT`);
  `seatAvailability` currently covers only the 金門–石井 sailings; `news` is empty.
- Not wrapped: `SpecificSchedule` (TDX answers 404) and the legacy `…/RouteType/{Internal|OutlyingIslands|Bilateral|MiniThreeLinks|Other}`
  arrays, which merge the nationwide and county routes; use `tdx.get` for those.

## See also

- [`examples/ferry-departures.ts`](../examples/ferry-departures.ts) — `npx tsx examples/ferry-departures.ts TW001` (today's ferry departures from a port)
- [Conventions](./conventions.md#cities-and-route-names)

## 繁體中文

航運：`tdx.ship.liveBoard()` 取得各港口即時出發／抵達看板（陣列名稱為 `ShipLiveBoardses`，港口名稱欄位為 `ZhTw`），`routes`、`ports`、`operators`、`vessels`、`stopsOfRoute`、`odFare`／`odFareBetween('TWKEL', 'TW007')`、`generalSchedule(routeId?)`／`dailySchedule(routeId?)`（全部每日班表約 1.3 MB，請指定航線）、`livePosition`（AIS 船位）、`seatAvailability`、`alerts`、`news` 與 `authorities`。縣市藍色公路（澎湖離島、高雄港、淡水河、金門九宮）由各縣市政府發布，與航港局全國資料互不重疊，請用 `tdx.ship.domestic.routes('PenghuCounty')` 等方法查詢。班表時間不補零（`6:15`），縣市每日班表日期為 `YYYY/MM/DD`。
