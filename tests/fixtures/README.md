# Test fixtures

These JSON files are **hand-written, schema-derived samples**, not recorded API responses.
Every field name, nesting level, required/optional flag and nullable flag follows the official
TDX OpenAPI specs (`公共運輸-自行車 v2`, `公共運輸-公車 v2`, fetched 2026-10-20). The values
(IDs, coordinates, plate numbers, operators) are illustrative only.

They intentionally include edge cases: stations with missing English names, `null` capacity,
a suspended station with `null` availability, a stop with `StopStatus: 3` (last bus passed)
and `EstimateTime: null`, and a not-yet-departed bus (`StopStatus: 1`, `PlateNumb: "-1"`).

To compare against real data, add your keys to `.env` and run `npm run test:integration`,
which exercises the same endpoints against the live API.
