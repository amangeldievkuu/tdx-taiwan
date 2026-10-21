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

## See also

- [`examples/next-metro-train.ts`](../examples/next-metro-train.ts) — `npx tsx examples/next-metro-train.ts KRTC R10` (next trains at a metro station)
- [Conventions](./conventions.md)
- [Buses](./bus.md) — bus `eta` `EstimateTime` is in seconds

## 繁體中文

捷運：`tdx.metro.liveBoard('TRTC')` 等方法以軌道系統代碼（`TRTC`、`KRTC`、`TYMC`…）查詢。注意捷運看板的 `EstimateTime` 單位為**分鐘**（公車為秒），且臺北捷運（TRTC）看板只列出即將進站（0 分鐘）的列車；`odFare` 資料量大，建議以 `OriginStationID`／`DestinationStationID` 篩選。
