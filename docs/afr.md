# Alishan Forest Railway (`tdx.afr`)

The 阿里山林業鐵路 (`/v3/Rail/AFR/*`): the main line from 嘉義 (`360`) to 阿里山 (`378`) and the
祝山, 眠月 and 神木 branches. Every method returns a wrapper object (`UpdateTime`,
`AuthorityCode`, …) whose data array the query applies to, like `tdx.tra`.

## Methods

| Method                                       | TDX endpoint                                                            | Returns                |
| -------------------------------------------- | ----------------------------------------------------------------------- | ---------------------- |
| `tdx.afr.stations(query?)`                   | `GET /v3/Rail/AFR/Station`                                              | `AfrStations`          |
| `tdx.afr.lines(query?)`                      | `GET /v3/Rail/AFR/Line`                                                 | `AfrLines`             |
| `tdx.afr.stationsOfLine(query?)`             | `GET /v3/Rail/AFR/StationOfLine`                                        | `AfrStationOfLines`    |
| `tdx.afr.routes(query?)`                     | `GET /v3/Rail/AFR/Route`                                                | `AfrRoutes`            |
| `tdx.afr.stationsOfRoute(query?)`            | `GET /v3/Rail/AFR/StationOfRoute`                                       | `AfrStationOfRoutes`   |
| `tdx.afr.network(query?)`                    | `GET /v3/Rail/AFR/Network`                                              | `AfrNetworks`          |
| `tdx.afr.shapes(query?)`                     | `GET /v3/Rail/AFR/Shape`                                                | `AfrShapes`            |
| `tdx.afr.operators(query?)`                  | `GET /v3/Rail/AFR/Operator`                                             | `AfrOperators`         |
| `tdx.afr.trainTypes(query?)`                 | `GET /v3/Rail/AFR/TrainType`                                            | `AfrTrainTypes`        |
| `tdx.afr.generalTimetable(trainNo?, query?)` | `GET /v3/Rail/AFR/GeneralTrainTimetable[/TrainNo/{TrainNo}]`            | `AfrGeneralTimetables` |
| `tdx.afr.odFare(from?, to?, query?)`         | `GET /v3/Rail/AFR/ODFare[/{OriginStationID}/to/{DestinationStationID}]` | `AfrODFares`           |
| `tdx.afr.news(query?)`                       | `GET /v3/Rail/AFR/News`                                                 | `AfrNewsList`          |

## Example

```ts
// Regular trains from 嘉義 with their stops, and the adult fare to 阿里山
const [timetable, fares] = await Promise.all([
  tdx.afr.generalTimetable(),
  tdx.afr.odFare('360', '378'),
]);

for (const t of timetable.TrainTimetables) {
  const first = t.StopTimes[0];
  const last = t.StopTimes.at(-1);
  console.log(
    t.TrainInfo.TrainNo,
    `${first?.StationName.Zh_tw} ${first?.DepartureTime} → ${last?.StationName.Zh_tw} ${last?.ArrivalTime}`,
    t.TrainInfo.TripHeadSign,
  );
}

for (const od of fares.ODFares) {
  const adult = od.Fares.find((f) => f.TicketType === 1 && f.FareClass === 1);
  console.log(`train type ${od.TrainType}: NT$${adult?.Price}`);
}
```

## Notes

- Station IDs are three digits: `360` 嘉義, `361` 北門, `372` 十字路, `378` 阿里山, `381` 祝山.
  `StationClass` is a string; live data sends `X` for 嘉義 as well as the spec's `0`–`7`.
- The timetable is the regular (general) one only: TDX publishes no daily timetable or live
  board for the AFR. `TrainInfo` has no train type and `Note` / `OverNightStationID` are `" "`;
  `ServiceDay` has a `ServiceTag` (`請參閱官網`, "see the website") and no `TyphoonDay`. The
  wrapper omits `AuthorityCode` and `ExpireDate`.
- `odFare()` without stations returns every pair; each item is one train type (`TrainType` 1
  中興號, 5 阿里山號) with `Fares` in TRA's numeric codes (`TicketType`, `FareClass`,
  `CabinClass`). `EffectiveDate` is a bare date and `ExpireDate` is `""`.
- `routes()` sends `StartStationName` / `EndStationName` with `Zh_tw` and `En` swapped (source
  bug, kept as is); `RouteType` is `36`. `stationsOfRoute()` route names are `Zh_tw` only.
- `network()`'s `NetworkMapURL` is an object with a URL per language; `shapes()` are WKT
  `MULTILINESTRING`s (about 12 KB per line). `operators()` has no `OperatorLogoURL`.
- Cross-system distances for the AFR are in [`tdx.rail`](./rail.md) (`odDistance('AFR')`,
  `s2sDistance('AFR')`).

## See also

- [`examples/alishan-timetable.ts`](../examples/alishan-timetable.ts) — `npx tsx examples/alishan-timetable.ts` (regular trains and fares)
- [Taiwan Railway](./tra.md) — the shared types (`TraNameType`, `TraFare`, `TraNews`)
- [Cross-system rail](./rail.md)

## 繁體中文

阿里山林業鐵路：`tdx.afr.generalTimetable(trainNo?)`（定期時刻表，無每日時刻表與即時資料）、`stations`、`lines`、`stationsOfLine`、`routes`、`stationsOfRoute`、`network`、`shapes`（WKT）、`operators`、`trainTypes`（中興號、阿里山號、祝客等）、`odFare(from?, to?)`（票價，車站代碼如 `360` 嘉義、`378` 阿里山）、`news`。回應皆為包裝物件。
