# Test fixtures

> 資料來源：交通部運輸資料流通服務平臺 (MOTC Transport Data eXchange, TDX). The `metro-*.json`,
> `thsr-*.json`, `tra-*.json`, `parking-*.json`, `ev-*.json`, `air-*.json`, `traffic-*.json`, `ship-*.json`, `bus-stop-taipei.json`, `bus-position-taipei-307.json` and
> `bus-intercity-*.json` files contain TDX data and are used under the
> [TDX 資料授權利用條款](https://tdx.transportdata.tw/term), not this repository's MIT license.

These JSON files are **hand-written, schema-derived samples**, not recorded API responses.
Every field name, nesting level, required/optional flag and nullable flag follows the official
TDX OpenAPI specs (`公共運輸-自行車 v2`, `公共運輸-公車 v2`, fetched 2026-10-20). The values
(IDs, coordinates, plate numbers, operators) are illustrative only.

They intentionally include edge cases: stations with missing English names, `null` capacity,
a suspended station with `null` availability, a stop with `StopStatus: 3` (last bus passed)
and `EstimateTime: null`, and a not-yet-departed bus (`StopStatus: 1`, `PlateNumb: "-1"`).

The `metro-*.json` files are different: they are **trimmed live responses** from the
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

The `ev-*.json` files are trimmed EV wrappers (2026-10-21): one complete chain per connector
for a DC (Tesla TPC, 250 kW, free) and an AC (J1772, 7 kW, in use) connector in Taipei, picked in
code because the ID fields cannot be filtered with OData, plus one freeway service area station.
None were edited.

The `air-*.json` files are trimmed 公共運輸-航空 v2 responses (2026-10-21): three airports (桃園 and
松山 with coordinates, and 艾因 AAN with the empty `AirportPosition` and `AirportCityName` most
foreign airports have), the `/Airport/TPE` object, two airlines (中華航空 and one with an empty
`AirlineID` and `AirlineNameAlias`), three TPE departures (a passenger flight, a cargo flight with
an `Apron` instead of a `Gate`, and a cancelled one with a blank `Gate`), two TPE arrivals with
baggage claims and padded gates (`" A8"`), the `/FIDS/Flight/100` record, and the 松山 board cut
to two departures and two arrivals. None were edited. Added for 0.13.0: the Taoyuan METAR observation, two
general-schedule rows (AE and DA, `FlightNumber` with the airline prefix), two AE daily flights
(one normal, one cancelled with `FlightRemark: "X"`), one AE route's fares and the shortest CAA
news item, and one B7 seat-availability answer (sold out, no seat counts; the AE call timed out
upstream).

The `traffic-*.json` files are trimmed 路況資訊 v2 and 道路事件 v1 wrappers (2026-10-21), cut to one
to three items each and not edited. They keep the places where live data departs from the spec:
the per-kind array names (`Sections`, `LiveTraffics`, `Newses`, …) instead of `Items` and no
`Count`; Taipei live traffic with congestion level `"6"` and a `-99` reading next to a normal one;
Taipei's six-level congestion scale and the freeway scale with its `-1` closed level; Taipei
cameras with `SurveillanceType: -1`; a bi-directional provincial-highway detector; a freeway
detector reading with per-vehicle-class volumes; a freeway eTag pair with its WKT geometry and
its live flows; freeway news items without the `Description` the spec requires and with the
`0001-01-01` update time; a planned Taipei event located only by `Other`; two freeway live events
(congestion at an interchange exit, roadworks with blocked lanes); and three authorities. Added for 0.12.0: two freeway signs, a freeway sign's live
message (with `Type` and `Priority`), a Taipei one (text only) and a highway one (a blank `" "`
message with `MessageStatus: 0`), two freeway gantries, a freeway section's links, a Taipei
section's WKT shape, and the one-item wrapper `/Section/Freeway/0001` returns for a by-ID call.

The `ship-*.json` files are trimmed 公共運輸-航運 v3 wrappers (2026-10-21), cut to one to three
items each and not edited. They keep: the per-kind array names (`Ports`, `Routes`,
`ShipLiveBoardses`, `Newses`) and the static header with `VersionID` but no `Count`; ports without
the `Country` the spec requires; two nationwide routes and two Penghu county routes (authority
`PEN`, IDs absent from the nationwide feed); a daily timetable with unpadded `6:15` times and an
empty `ArrivalTime`, and a county one dated `2026/11/27`; the 小琉球白沙港 live board with `ZhTw`
port names and a departed and an on-time sailing; two AIS positions (one with an empty Chinese
name); the 金門–石井 seat availability with cabin seats; a typhoon alert with its scope; the empty
news list; and three authorities. `ship-od-fare-between.json` is the plain array the
`/ODFare/{O}/to/{D}` endpoint returns.

To compare against real data, add your keys to `.env` and run `npm run test:integration`,
which exercises the same endpoints against the live API.
