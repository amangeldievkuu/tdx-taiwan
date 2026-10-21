# Conventions

Rules that apply to every resource. Each resource page lists only what is specific to it.

## Field names and types

Responses keep TDX's original field names (`StationUID`, `AvailableRentBikes`, …) so they
match the [TDX documentation](https://tdx.transportdata.tw/api-service/swagger) and the field
names you use in `$filter`. Fields are optional or nullable exactly as the OpenAPI spec
declares them.

Where live data departs from the spec, the types follow the data and the resource page says so:
fields the spec requires but TDX omits are optional, values outside the spec's enum are plain
numbers or strings, and array names follow what TDX sends.

## Wrapper objects vs arrays

TDX's v2 endpoints return plain arrays (bike, bus, most of metro and THSR, air). Its v1 and v3
endpoints wrap the items in an object with update times and an authority code (TRA, parking, EV,
road traffic, ferries, plus `metro.alerts` and `thsr.availableSeats`). The SDK passes both shapes
through unchanged; for wrapper objects the query applies to the items inside, and the spec's
`Items` array is named per kind (`Stations`, `LiveTraffics`, `ShipLiveBoardses`, …). `Count` is
in the specs but never sent.

## Cities and route names

City names autocomplete (`'Taipei'`, `'NewTaipei'`, `'Kaohsiung'`, …) but any string is
accepted. Route names may be Chinese (`'紅5'`); they are URL-encoded for you.

Each endpoint accepts its own set of cities; the `*City` types list the known ones and the
resource pages note the exceptions. TDX answers an unsupported city with a 400 `TdxApiError`
whose message lists the accepted cities. Bus route names are matched exactly by default; see
[Buses](./bus.md).

## Dates

`date` arguments (`thsr.timetable`, `tra.timetable`) accept a `Date` or a `'YYYY-MM-DD'` string
and default to today. A `Date` is read as the calendar day in Taiwan (UTC+8), whatever the
machine's time zone. `trainDate()` is exported for building `tdx.get` paths the same way. See
[High speed rail](./thsr.md) for the timetable window.

## Large lists, billing and caching

TDX bills usage in points by call count and by response size (per its Swagger pages, 1,500 calls
or 150 MB per point). Prefer `$filter`, `$select` and `$top` on large lists, and turn on
`cache: true` for static data; the resource pages flag the large responses. See the
[Options](../README.md#options) section of the README for the cache TTLs and rate limiting.
