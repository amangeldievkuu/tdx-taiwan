# Test fixtures

> 資料來源：交通部運輸資料流通服務平臺 (MOTC Transport Data eXchange, TDX). The `metro-*.json`,
> `thsr-*.json`, `tra-*.json`, `parking-*.json`, `bus-stop-taipei.json`, `bus-position-taipei-307.json` and
> `bus-intercity-*.json` files contain TDX data and are used under the
> [TDX 資料授權利用條款](https://tdx.transportdata.tw/term), not this repository's MIT license.

These JSON files are **hand-written, schema-derived samples**, not recorded API responses.
Every field name, nesting level, required/optional flag and nullable flag follows the official
TDX OpenAPI specs (`公共運輸-自行車 v2`, `公共運輸-公車 v2`, fetched 2026-10-20). The values
(IDs, coordinates, plate numbers, operators) are illustrative only.

They intentionally include edge cases: stations with missing English names, `null` capacity,
a suspended station with `null` availability, a stop with `StopStatus: 3` (last bus passed)
and `EstimateTime: null`, and a not-yet-departed bus (`StopStatus: 1`, `PlateNumb: "-1"`).

The `metro-*.json` and `thsr-*.json` files are different: they are **trimmed live responses** from the
`公共運輸-軌道 v2` Metro endpoints (2026-10-20), cut to a few records each, with duplicate
fare entries removed. They keep the places where TDX's data departs from its spec: a station
without `StationAddress`, a line without `LineColor`, and empty `LineSectionName` objects. One
live-board record (`O1`) was edited to `ServiceStatus: 3` with `EstimateTime: null` to cover
the documented "last train passed" case, which was not live at the time.

The `thsr-*.json` files are trimmed the same way (THSR endpoints, 2026-10-20): two stations,
two timetable rows (with the empty `Note: {}` TDX returns), the Taipei → Zuoying fares, a seat
board cut to three trains that cover the `O`/`L`/`X` statuses, and the normal-day alert.

The 0.4.0 bus fixtures (`bus-stop-taipei.json`, `bus-position-taipei-307.json`,
`bus-intercity-*.json`) and `metro-alert-trtc.json` are also trimmed live responses (2026-10-20),
fetched through the SDK; the Taipei stops show the missing `StationGroupID`.

The `tra-*.json` files are trimmed TRA v3 wrappers (2026-10-21), fetched through the SDK with
OData filters: two stations, two 臺北 → 高雄 trains (without the `AuthorityCode` the spec
requires), the 自強 and 區間 fares in both directions, the 板橋 live board with a delayed train,
a train live board, and the normal-day alert (without `AlertID` and `Description`). None were
edited.

The `parking-*.json` files are trimmed Taipei wrappers (2026-10-21), fetched through the SDK
with OData filters and not edited. They show how loosely the lists join: car park `TPE0448` has
no availability record (although it is flagged `LiveOccuppancyAvailable`), availability
`TPE0096` has no car park, and only `TPE0567` appears in both. Segment `6018000` has a road
section without `End`.

To compare against real data, add your keys to `.env` and run `npm run test:integration`,
which exercises the same endpoints against the live API.
