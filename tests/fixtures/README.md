# Test fixtures

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

To compare against real data, add your keys to `.env` and run `npm run test:integration`,
which exercises the same endpoints against the live API.
