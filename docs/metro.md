# Metro (`tdx.metro`)

Metro methods take a rail system code: `TRTC` 臺北捷運, `KRTC` 高雄捷運, `TYMC` 桃園捷運,
`TMRT` 臺中捷運, `KLRT` 高雄輕軌, `NTDLRT` 淡海輕軌, `TRTCMG` 貓空纜車, `NTMC` 新北捷運,
`NTALRT` 安坑輕軌.

## Methods

| Method                                         | TDX endpoint                                         | Returns                     |
| ---------------------------------------------- | ---------------------------------------------------- | --------------------------- |
| `tdx.metro.stations(system, query?)`           | `GET /v2/Rail/Metro/Station/{RailSystem}`            | `MetroStation[]`            |
| `tdx.metro.lines(system, query?)`              | `GET /v2/Rail/Metro/Line/{RailSystem}`               | `MetroLine[]`               |
| `tdx.metro.stationsOfLine(system, query?)`     | `GET /v2/Rail/Metro/StationOfLine/{RailSystem}`      | `MetroStationOfLine[]`      |
| `tdx.metro.liveBoard(system, query?)`          | `GET /v2/Rail/Metro/LiveBoard/{RailSystem}`          | `MetroLiveBoard[]`          |
| `tdx.metro.firstLastTimetable(system, query?)` | `GET /v2/Rail/Metro/FirstLastTimetable/{RailSystem}` | `MetroFirstLastTimetable[]` |
| `tdx.metro.odFare(system, query?)`             | `GET /v2/Rail/Metro/ODFare/{RailSystem}`             | `MetroODFare[]`             |
| `tdx.metro.alerts(system, query?)`             | `GET /v2/Rail/Metro/Alert/{RailSystem}`              | `MetroAlerts`               |
| `tdx.metro.stationExits(system, query?)`       | `GET /v2/Rail/Metro/StationExit/{RailSystem}`        | `MetroStationExit[]`        |
| `tdx.metro.stationFacilities(system, query?)`  | `GET /v2/Rail/Metro/StationFacility/{RailSystem}`    | `MetroStationFacility[]`    |
| `tdx.metro.lineTransfers(system, query?)`      | `GET /v2/Rail/Metro/LineTransfer/{RailSystem}`       | `MetroLineTransfer[]`       |
| `tdx.metro.stationTransfers(system, query?)`   | `GET /v2/Rail/Metro/StationTransfer/{RailSystem}`    | `MetroStationTransfers`     |
| `tdx.metro.routes(system, query?)`             | `GET /v2/Rail/Metro/Route/{RailSystem}`              | `MetroRoute[]`              |
| `tdx.metro.stationsOfRoute(system, query?)`    | `GET /v2/Rail/Metro/StationOfRoute/{RailSystem}`     | `MetroStationOfRoute[]`     |
| `tdx.metro.frequency(system, query?)`          | `GET /v2/Rail/Metro/Frequency/{RailSystem}`          | `MetroFrequency[]`          |
| `tdx.metro.stationTimetable(system, query?)`   | `GET /v2/Rail/Metro/StationTimeTable/{RailSystem}`   | `MetroStationTimetable[]`   |
| `tdx.metro.news(system, query?)`               | `GET /v2/Rail/Metro/News/{RailSystem}`               | `MetroNewsList`             |
| `tdx.metro.livePosition(system, query?)`       | `GET /v2/Rail/Metro/LivePosition/{RailSystem}`       | `MetroLivePositions`        |
| `tdx.metro.network(system, query?)`            | `GET /v2/Rail/Metro/Network/{RailSystem}`            | `MetroNetwork[]`            |
| `tdx.metro.s2sTravelTime(system, query?)`      | `GET /v2/Rail/Metro/S2STravelTime/{RailSystem}`      | `MetroS2STravelTime[]`      |
| `tdx.metro.shapes(system, query?)`             | `GET /v2/Rail/Metro/Shape/{RailSystem}`              | `MetroShape[]`              |
| `tdx.metro.stationPlatforms(system, query?)`   | `GET /v2/Rail/Metro/StationPlatform/{RailSystem}`    | `MetroStationPlatforms`     |
| `tdx.metro.stoppingPatterns(system, query?)`   | `GET /v2/Rail/Metro/StoppingPattern/{RailSystem}`    | `MetroStoppingPatterns`     |
| `tdx.metro.transferStations(system, query?)`   | `GET /v2/Rail/Metro/TransferStations/{RailSystem}`   | `MetroTransferStation[]`    |

## Example

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

## Notes

- `alerts(system)` returns an object (`{ UpdateTime, AuthorityCode, Alerts, … }`); the query
  filters its `Alerts`. On a normal day there is one "正常營運" alert with `Status: 1`. It
  supports TRTC, KRTC, TYMC, KLRT, TRTCMG and TMRT.
- `liveBoard` `EstimateTime` is in **minutes**; bus `eta` `EstimateTime` is in seconds.
- `liveBoard` only supports `TRTC`, `KRTC`, `TYMC` and `KLRT`; other systems get a
  `TdxApiError` (400). KRTC, TYMC and KLRT list the next train for every station. TRTC only
  lists trains arriving right now (`EstimateTime` is always `0`), so most Taipei stations are
  absent at any given moment.
- `odFare` returns every station pair (about 15,000 for TRTC), so filter on
  `OriginStationID` / `DestinationStationID`.
- Where live data departs from the spec, the types follow the data: `StationAddress` and
  `LineColor` are optional, and `LineSectionName` is often `{}`.
- Station info: `stationExits` (position, address, stairs / escalator / lift flags),
  `stationFacilities` (lifts, information desks, fountains, toilets with map links),
  `lineTransfers` (minutes between lines at interchanges; TRTC, KRTC, NTMC) and
  `stationTransfers` (buses, bikes, car parks and taxis per exit; TRTC, NTMC, TYMC, returns a
  wrapper whose `UpdateInterval` is 0).
- Service routes: `routes` are a line's end-to-end runs per direction (`BL-1`) with run time and
  length; `stationsOfRoute` lists their stations in order. `frequency` gives headways per route,
  kind of day (`ServiceDay.ServiceTag` 平日 / 假日) and time band; `stationTimetable` every
  departure from each station towards each destination. TRTC does not publish the 文湖線 station
  timetable, so use `frequency` for it.
- `news(system)` is a wrapper (`Newses`) for TRTC, KRTC, TYMC, KLRT and TMRT. Taipei sends the
  sentinel `0001-01-01T00:00:00+08:06` for every time field and omits `Language`.
- `livePosition(system)` works only for the Kaohsiung light rail (`KLRT`); other systems answer 400. Topology: `network(system)` is the operator's network record with its map URL and lines
  (`TRTCMG` included), `shapes(system)` the line geometries as WKT `MULTILINESTRING` (about 16 KB
  per line, `EncodedPolyline` is `""`), `s2sTravelTime(system)` the run and dwell seconds between
  adjacent stations per route, `stationPlatforms('KLRT')` the platforms (Kaohsiung light rail
  only, wrapper without `AuthorityCode`), `stoppingPatterns('TYMC')` the 普通車 / 直達車 patterns
  of the airport line (TYMC only, `UpdateInterval: -1`) and `transferStations('TRTC_NTMC' |
'KRTC')` the stations two lines share (`BL07_Y16`, names are plain strings). Every metro
  endpoint in the 軌道 v2 spec is now wrapped.

## See also

- [`examples/next-metro-train.ts`](../examples/next-metro-train.ts) — `npx tsx examples/next-metro-train.ts KRTC R10` (next trains at a metro station)
- [Conventions](./conventions.md)
- [Buses](./bus.md) — bus `eta` `EstimateTime` is in seconds

## 繁體中文

捷運：`tdx.metro.liveBoard('TRTC')` 等方法以軌道系統代碼（`TRTC`、`KRTC`、`TYMC`…）查詢。注意捷運看板的 `EstimateTime` 單位為**分鐘**（公車為秒），且臺北捷運（TRTC）看板只列出即將進站（0 分鐘）的列車；`odFare` 資料量大，建議以 `OriginStationID`／`DestinationStationID` 篩選。另有 `stationExits`／`stationFacilities`（出入口與車站設施）、`lineTransfers`／`stationTransfers`（路線間與跨運具轉乘）、`routes`／`stationsOfRoute`（營運路線）、`frequency`（班距）、`stationTimetable`（站別時刻表，臺北捷運不含文湖線）、`news` 與 `livePosition`（僅高雄輕軌 KLRT）；路網與線型：`network`、`shapes`（WKT）、`s2sTravelTime`（站間行駛秒數）、`stationPlatforms('KLRT')`、`stoppingPatterns('TYMC')`、`transferStations('TRTC_NTMC')`（共站站點）。
