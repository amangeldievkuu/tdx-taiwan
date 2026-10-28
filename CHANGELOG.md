# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.18.0] - 2026-10-28

### Added

- `cache.store`: a persistent second level for static responses, read when the in-memory cache
  misses and written for `cache.storeTtlMs` (default 24 hours), so they survive restarts.
  Real-time responses are never stored, and store errors are ignored.
- `tdx-taiwan/file-cache`: `FileCacheStore`, a store keeping one JSON file per URL in a
  directory, with `prune()` and `clear()`. The `TdxCacheStore` interface is exported for other
  backends.

## [0.17.0] - 2026-10-27

### Added

- `tdx.bus.eta(city)` and `tdx.bus.interCity.eta()` without a route name: every route's arrival
  at every stop, to filter on `StopUID` for one stop's arrivals in a single call.
- `tdx.bus.schedule(city, routeName?)` and `tdx.bus.interCity.schedule(routeName?)`
  (`/v2/Bus/Schedule/*`): fixed trips or headway bands per sub-route, typed as `BusSchedule`.
- `tdx.bus.alerts(city)`, `tdx.bus.news(city)`, `tdx.bus.interCity.alerts()` and
  `tdx.bus.interCity.news()` (`/v2/Bus/Alert/*`, `/v2/Bus/News/*`), typed as `BusAlert` (with
  its `Scope`) and `BusNews`.

## [0.16.0] - 2026-10-27

### Added

- `nearby: { lat, lon, meters }` in query options and `.nearby(lat, lon, meters)` on the query
  builder, sent as TDX's `$spatialFilter=nearby(lat,lon,meters)`.
- `tdx.bus.stations(city)` and `tdx.bus.interCity.stations()` (`/v2/Bus/Station/*`): each stop
  place with the routes that serve it, e.g. the stations near a point with `nearby`.

## [0.15.0] - 2026-10-22

### Added

- `tdx.afr`: the Alishan Forest Railway (`/v3/Rail/AFR/*`) — `stations`, `lines`,
  `stationsOfLine`, `routes`, `stationsOfRoute`, `network`, `shapes`, `operators`, `trainTypes`,
  `generalTimetable(trainNo?)`, `odFare(from?, to?)` and `news`, with
  `examples/alishan-timetable.ts`.
- `tdx.rail`: the cross-system `/v2/Rail/*` feeds — `operators`, `odDistance(system, from?,
to?)`, `odFare(system, from, to)` (by station name, Chinese labels) and `s2sDistance(system)`.
- The remaining rail endpoints. Metro: `network`, `s2sTravelTime`, `shapes`,
  `stationPlatforms` (KLRT), `stoppingPatterns` (TYMC) and `transferStations` (`TRTC_NTMC`,
  `KRTC`). THSR: `legSeatStatus`, `odSeatStatus` (all pairs, one pair, one train),
  `freeSeatingCars`, `dailyTrainInfo(trainNo?, date?)`, `shapes` and `stationsOfLine`. TRA:
  `timetableInclusive`, `specificTimetable(trainNo?)`, `lineNetwork`, `lineTransfers`,
  `stationTransfers`, `network`, `operators` and `shapes`. Every endpoint of the 軌道 v2 and v3
  specs is now wrapped except the `/v2/Rail/TRA/*` duplicates of the v3 feeds. Types follow
  live data (object `NetworkMapURL`, AFR's swapped route names and missing `TyphoonDay`,
  plain-string names in the cross-system feeds).

## [0.14.0] - 2026-10-21

### Added

- Rail extras. Metro: `stationExits`, `stationFacilities`, `lineTransfers`, `stationTransfers`,
  `routes`, `stationsOfRoute`, `frequency`, `stationTimetable`, `news` and `livePosition`
  (KLRT only). THSR: `generalTimetable(trainNo?)`, `dailyTimetable(date?)`,
  `trainTimetable(trainNo, date?)`, `stationTimetable(station, date?)`, `trainDates`, `news`,
  `stationExits`, and `availableSeats()` without a station for every station's board. TRA:
  `generalTimetable(trainNo?)`, `generalStationTimetable(station?)`, `dailyTimetable(date?)`,
  `trainTimetable(trainNo)` (today only in v3), `stationTimetable(station)`,
  `dailyStationTimetable(date?)`, `trainDates`, `lines`, `stationsOfLine`, `trainTypes`,
  `stationExits`, `stationFacilities`, `news`, and `liveBoard()` / `trainLiveBoard()` without an
  argument for every station and every running train. Types follow live data (Taipei news time
  sentinels, TRA's full-timestamp `EffectiveDate` and empty text fields, THSR's `""` expiry).

## [0.13.0] - 2026-10-21

### Added

- The rest of 公共運輸-航空 v2 under `tdx.air`: `metar(airport?)` (airport weather, values as
  strings with units), `generalSchedule('Domestic' | 'International')` (the published timetable;
  `FlightNumber` includes the airline code there), `dailySchedule(airline)`, `routeFares(airline)`
  and `seatAvailability(airline, airRoute, date, flightNumber)` for the domestic airlines AE, B7
  and DA, and `news()`. Seat availability is forwarded to the airline by TDX with a 30 s timeout,
  so it is slow and may answer 500; the docs say how to cope.

## [0.12.0] - 2026-10-21

### Added

- The rest of 路況資訊 v2 under `tdx.traffic` (city, `freeway` and `highway`): `cms` and
  `cmsLive` (changeable message signs and what they show), `etags` (eTag gantries),
  `sectionLinks` (the basic links of each section) and `sectionShapes` (WKT geometry).
- By-ID lookups: every traffic list method that has a `…/{ID}` endpoint in the spec now accepts
  the item's ID before the query (`tdx.traffic.freeway.liveTraffic('0001')`,
  `tdx.traffic.cctvs('Taipei', 'T000001')`) and returns the same wrapper with that one item;
  an unknown ID yields an empty list, not an error.

## [0.11.0] - 2026-10-21

### Added

- Per-resource documentation in `docs/` (`bike`, `bus`, `metro`, `thsr`, `tra`, `parking`, `ev`,
  `air`, `traffic`, `ship`), plus `docs/conventions.md` (field names, wrapper objects, cities,
  dates, large lists) and `docs/nestjs.md`. `CONTRIBUTING.md` describes the scripts, how to fetch
  a TDX spec, the fixture rules and the release steps. A test checks every documentation link.
- `ListRequester`, `ObjectRequester` and `CacheClass` are exported as types (the constructor
  parameters of the exported `*Api` classes).
- Shared types `ZhEnName`, `WrapperHeader` and `Flag`. `AirName`, `ShipName`, `EvWrapperHeader`,
  `ShipLiveWrapperHeader`, `ParkingFlag`, `TraFlag`, `ShipFlag` and `TrafficFlag` remain exported
  as aliases of them.

### Changed

- The README is a quick start plus a resource index; the per-resource notes and examples moved
  to `docs/` unchanged. The 繁體中文 section now covers every resource, caching, hooks, errors,
  `tdx.get` and `trainDate`.
- Documentation fixes: `getAccessToken()` returns `Promise<string>`; retries also cover network
  errors; the cache TTL descriptions list every data kind; `tdx.ship.domestic` lists its ten
  methods; the `EvFreewayApi` and ship/traffic method comments are complete and wrapped;
  `tests/fixtures/README.md` no longer attributes the THSR files to the Metro endpoints.
- `MetroAlerts` extends `WrapperHeader`; `ShipLiveWrapperHeader.Count` is `number | null`
  (optional, never sent).

## [0.10.0] - 2026-10-21

### Added

- Ferry (公共運輸-航運 v3) endpoints under `tdx.ship`: `ports`, `routes`, `operators`, `vessels`,
  `stopsOfRoute`, `odFare`, `odFareBetween(from, to)`, `generalSchedule(routeId?)`,
  `dailySchedule(routeId?)`, `liveBoard` (per-port departure and arrival boards), `livePosition`
  (AIS), `seatAvailability`, `alerts`, `news` and `authorities`, plus the county and city
  blue-highway feeds under `tdx.ship.domestic.*(city, …)`, which hold routes the nationwide feed
  lacks (Penghu, Kaohsiung, New Taipei, Taipei, Kinmen). Responses are wrapper objects named per
  kind (`Ports`, `Routes`, `ShipLiveBoardses`, `Newses`, …) and never carry `Count`; static
  wrappers carry `VersionID`. Types follow live data where it departs from the spec: ports have no
  `Country`, live-board port names use `ZhTw`, timetable times are unpadded (`6:15`), and city
  daily schedules use `YYYY/MM/DD` dates. `SpecificSchedule` (HTTP 404) and the legacy
  `RouteType` array endpoints are not wrapped.
- `examples/ferry-departures.ts` (`npm run example:ferry`).

## [0.9.0] - 2026-10-21

### Added

- Road traffic (路況資訊 v2 and 道路事件 v1) endpoints under `tdx.traffic`, by city and for the
  national freeways (`tdx.traffic.freeway.*`) and provincial highways (`tdx.traffic.highway.*`):
  `sections`, `liveTraffic` (speed, travel time and congestion level per section),
  `congestionLevels` (the scales those levels refer to), `cctvs`, `vds` and `vdLive` (vehicle
  detectors with live lane flows), `etagPairs` and `etagPairLive` (eTag gantry pairs with live
  travel times), `news`, `events` (announced; cities and highways) and `liveEvents`, plus
  `authorities`. Responses are wrapper objects named per kind (`Sections`, `LiveTraffics`,
  `Newses`, …) rather than the spec's `Items`, and never carry `Count`. Each kind accepts its own
  set of cities (eTag pairs exclude Taipei, live traffic covers nine cities); TDX answers 400 with
  the accepted list, and the README and `TrafficCity` docs list them. Types follow live data where
  it departs from the spec: `CongestionLevel` is a string, Taipei defines a sixth level, Taipei
  cameras send `SurveillanceType: -1`, and the freeway news feed omits `Description`.
- `examples/road-traffic.ts` (`npm run example:traffic`).

## [0.8.0] - 2026-10-21

### Added

- Air (公共運輸-航空 v2) endpoints under `tdx.air`: `airports` / `airport(iata)`,
  `airlines` / `airline(iata)`, and the live FIDS boards `departures(airport?)`,
  `arrivals(airport?)`, `flights(flightNo?)` (both legs of a flight) and `boards(airport?)`
  (departures and arrivals grouped per airport). The single-code lookups return one object and
  fail with a 404 `TdxApiError` for unknown codes. Types follow the spec and live data: names are
  `AirName` (both parts optional, since most foreign airports have an empty `AirportCityName` and
  no position), flight times are `AirLocalDateTime` (`yyyy-MM-ddTHH:mm`, Taiwan local time, no
  offset), flight numbers are digits only with the airline in `AirlineID`, and the README lists
  the fields the spec promises but live data never sends (`*RemarkEn`, `FlightStatus*`,
  `CodeShare`). Cargo flights are filtered with `IsCargo eq false` (TDX's `IsCargo` parameter is
  not needed).
- `examples/flight-board.ts` (`npm run example:flights`).

## [0.7.0] - 2026-10-21

### Added

- EV charging (綠色運輸-充電樁 v1) endpoints by city and for freeway service areas
  (`tdx.ev.freeway.*`): `stations`, `chargingPoints`, `connectors`, `liveStatus` (free, in use
  or out of order) and `chargingRates`. Responses are wrapper objects; queries apply to their
  items. The types include the ID fields live data uses to join the lists (`StationID`,
  `ChargingPointID`, `ConnectorID`) even though the spec omits them; those fields cannot be used
  in OData queries. The README explains how to join the lists reliably.
- `examples/nearest-ev-charger.ts` (`npm run example:ev`).

## [0.6.0] - 2026-10-21

### Added

- Parking (停車資訊 v1) endpoints by city: `parking.carParks`, `parking.availability` (live free
  spaces in car parks), `parking.segments` (on-street segments) and
  `parking.segmentAvailability` (live free curbside spaces). Responses are wrapper objects using
  the live array names (`CarParks`, `ParkingAvailabilities`, `ParkingSegments`,
  `CurbParkingSegmentAvailabilities`) rather than the spec's `Items`. Types are checked against
  every city's live data; fields the spec requires but live data omits (such as `CarParkRegNo`,
  `Telephone`, `Email`, `TownName`, `TownID` and road-section ends) are optional.
- README notes that car parks and availability join only partly on `CarParkID`.
- `examples/nearest-parking.ts` (`npm run example:parking`).

## [0.5.0] - 2026-10-21

### Added

- Taiwan Railway (臺鐵) endpoints from the TDX Rail **v3** API: `tra.stations`,
  `tra.timetable(from, to, date?)`, `tra.odFare(from, to)`, `tra.liveBoard(station)` (imminent
  trains with platform and delay), `tra.trainLiveBoard(trainNo)` (where a train is and how late)
  and `tra.alerts`. Every response is the v3 wrapper object; queries apply to its items. Types
  are transcribed from the spec and checked against live data; `TraNameType` uses `Kr` for
  Korean, and `AuthorityCode` (timetable and fare wrappers) plus `AlertID` / `Description`
  (normal-day alert) are optional because live data omits them.
- `examples/tra-trains.ts` (`npm run example:tra`).

## [0.4.0] - 2026-10-20

### Added

- InterCity coaches (公路客運) under `bus.interCity`: `routes(routeName?)`, `stopsOfRoute`,
  `eta` and `positions`, returning the same types as the city methods. Route names are matched
  exactly by default, as for city buses (TDX returns all 91 `9xxx` routes for `'9'`).
- `bus.positions(city, routeName)`: live vehicle positions (A1) as `BusPosition`, with exact
  route matching.
- `bus.stops(city)`: every stop in a city as `BusStopInfo`. `StationGroupID` is optional
  because Taipei and Kaohsiung omit it despite the spec.
- `metro.alerts(system)`: service alerts as a `MetroAlerts` object; the query applies to its
  `Alerts`. Supported for TRTC, KRTC, TYMC, KLRT, TRTCMG and TMRT.
- README notes on TDX's point-based billing (by calls and by response size).

## [0.3.1] - 2026-10-20

### Changed

- Documentation only: the README now states that this is an unofficial SDK (in English and
  Traditional Chinese) and has a "Data source and terms" section summarising the TDX
  [資料授權利用條款](https://tdx.transportdata.tw/term): credit 「交通部運輸資料流通服務平臺」 when
  publishing TDX data, no trademark licence, and plan-based pricing and rate limits. The test
  fixtures that contain TDX data now carry that attribution.

## [0.3.0] - 2026-10-20

### Added

- Taiwan High Speed Rail (高鐵) endpoints: `thsr.stations`, `thsr.timetable(from, to, date?)`
  (trains between two stations on a day), `thsr.odFare(from, to)`, `thsr.availableSeats(station)`
  (real-time seat board: `O` available, `L` limited, `X` sold out) and `thsr.alerts`, with
  types transcribed from the TDX Rail v2 OpenAPI spec and checked against live data.
  `DailyTrainInfo.Note` is typed `Partial<NameType>` because TDX returns `{}`, and stop times
  are documented as `HH:mm` (the spec says `HH:mm:ss`).
- `trainDate(date?)` formats a `Date` (or validates a `YYYY-MM-DD` string) as the calendar day
  in Taiwan, defaulting to today, for THSR paths and `tdx.get`.
- Endpoints that wrap their items in an object (such as the THSR seat board) are now supported
  and cached like list endpoints; OData queries apply to the wrapped items.
- `examples/thsr-trains.ts` (`npm run example:thsr`).

## [0.2.1] - 2026-10-20

### Fixed

- A response body that failed or timed out while being read (after the headers arrived) threw
  a raw `TypeError` / `DOMException` without being retried. It is now retried like a network
  error and surfaces as `TdxNetworkError` once retries run out. The same applies to the token
  response, which now fails with `TdxAuthError`.
- A transient token endpoint failure (network error, 429 or 5xx) failed the request at once.
  It is now retried inside the request's retry loop, with the same backoff, `Retry-After`
  handling and `onRetry` hook. 400/401 from the token endpoint are still not retried.
  `TdxAuthError` has a new `retryAfterMs` field.
- When concurrent requests got 401 with the same expired token, a late 401 could discard the
  fresh token another request had just fetched, causing an extra token request.
  `TokenManager.invalidate(usedToken)` now only drops the cache if it still holds that token.
- The `fetch` option's documentation said Node 18+; the minimum is Node 20.

## [0.2.0] - 2026-10-20

### Added

- Metro endpoints (捷運/輕軌/纜車) for every TDX rail system: `metro.stations`, `metro.lines`,
  `metro.stationsOfLine`, `metro.liveBoard` (real-time; `EstimateTime` in minutes; TRTC only
  lists trains arriving now),
  `metro.firstLastTimetable` and `metro.odFare`, with types transcribed from the TDX Rail v2
  OpenAPI spec and checked against live data for every system. `StationAddress` and
  `LineColor` are optional and `LineSectionName` may be `{}`, because live data omits them
  despite the spec.

## [0.1.1] - 2026-10-20

### Added

- Releases are published from GitHub Actions with npm trusted publishing, so each version
  carries [provenance](https://docs.npmjs.com/generating-provenance-statements) linking it to
  the source commit and workflow run.

## [0.1.0] - 2026-10-20

### Added

- `TdxClient` with OAuth2 client-credentials auth against TDXConnect: in-memory token cache,
  refresh 60 s before expiry, and deduplicated concurrent refreshes.
- HTTP layer on native `fetch`: retries on 429, 5xx and network errors with exponential
  backoff + full jitter (max 3, honours `Retry-After`), one re-authentication on 401, a
  client-side rate limiter (`requestsPerSecond`, default 5) and per-request timeouts.
- Typed errors: `TdxError`, `TdxAuthError`, `TdxApiError`, `TdxRateLimitError`, `TdxNetworkError`.
- OData query builder (`query()`, `ODataQuery`, `odata.str`, `clone()`) for `$filter`, `$select`,
  `$orderby`, `$top`, `$skip`; `$format=JSON` is always sent.
- Bike endpoints: `bike.stations(city)`, `bike.availability(city)`.
- Bus endpoints: `bus.routes(city, routeName?)`, `bus.stopsOfRoute(city, routeName)`,
  `bus.eta(city, routeName)`. Route names match `RouteName/Zh_tw` exactly by default;
  `{ exact: false }` keeps TDX's prefix matching.
- Response types transcribed from the TDX OpenAPI specs (Bike v2, Bus v2).
- Optional in-memory TTL response cache (1 h for static data, 15 s for real-time data).
- `tdx.get(path, query?)` for TDX endpoints not wrapped yet.
- `onRequest({ url })` and `onRetry({ url, attempt, status, delayMs })` hooks on
  `TdxClient` options, for logging and metrics.
- NestJS integration at `tdx-taiwan/nestjs`: `TdxModule.forRoot()` / `forRootAsync()`.
  Injection uses `useFactory` and explicit tokens only, so it does not depend on decorator
  metadata. Tested against `@nestjs/common` v10, v11 and v12.
- Example: `examples/nearest-youbike.ts`.

### Pre-release changes

- Package metadata: `repository`, `homepage`, `bugs` and `publishConfig.access: public`.
- Minimum Node.js is now 20 (`engines: >=20`, build target `node20`); Node 18 is end-of-life.
- Type declarations rely on `@types/node` for `fetch` types; the `DOM` lib is no longer used.
- README:
  - The NestJS example uses an explicit `@Inject(TdxClient)`.
  - Documents exact route-name matching and the `exact: false` option.
  - The token-endpoint limit (20/min per IP) now cites TDX's official sample-code docs; API
    limits link to the pricing page.
- Bus route names now match exactly by default. TDX matches the `{RouteName}` path segment
  as a prefix (`307` also returned `307西藏三民`; `紅5` also returned `紅50`, `紅55`, …), so the
  SDK adds a `RouteName/Zh_tw eq '…'` filter. Pass `{ exact: false }` for the old behaviour.
  Query builders passed in are copied, not modified. Verified against the live API: every
  city's ETA records carry `RouteName`, so the filter drops nothing.
- Route names containing `/` (some Kinmen routes) previously returned 404; with exact matching
  the SDK requests the part before the `/` and filters on the full name.
- Tooling and tests:
  - ESLint uses `strictTypeChecked` with the project service.
  - The Vitest integration config extends the base config through `mergeConfig`.
  - New tests run the built `dist/` in a plain Node process: NestJS resolution of `TdxClient`
    from the ESM and CJS bundles (without decorator metadata), and an open-handles check
    showing that no timers keep the process alive.
  - CI runs the dist tests against each NestJS major and smoke-tests the packed tarball on
    Node 20, 22 and 24.

[Unreleased]: https://github.com/amangeldievkuu/tdx-taiwan/compare/v0.18.0...HEAD
[0.18.0]: https://github.com/amangeldievkuu/tdx-taiwan/compare/v0.17.0...v0.18.0
[0.17.0]: https://github.com/amangeldievkuu/tdx-taiwan/compare/v0.16.0...v0.17.0
[0.16.0]: https://github.com/amangeldievkuu/tdx-taiwan/compare/v0.15.0...v0.16.0
[0.15.0]: https://github.com/amangeldievkuu/tdx-taiwan/compare/v0.14.0...v0.15.0
[0.14.0]: https://github.com/amangeldievkuu/tdx-taiwan/compare/v0.13.0...v0.14.0
[0.13.0]: https://github.com/amangeldievkuu/tdx-taiwan/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/amangeldievkuu/tdx-taiwan/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/amangeldievkuu/tdx-taiwan/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/amangeldievkuu/tdx-taiwan/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/amangeldievkuu/tdx-taiwan/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/amangeldievkuu/tdx-taiwan/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/amangeldievkuu/tdx-taiwan/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/amangeldievkuu/tdx-taiwan/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/amangeldievkuu/tdx-taiwan/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/amangeldievkuu/tdx-taiwan/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/amangeldievkuu/tdx-taiwan/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/amangeldievkuu/tdx-taiwan/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/amangeldievkuu/tdx-taiwan/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/amangeldievkuu/tdx-taiwan/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/amangeldievkuu/tdx-taiwan/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/amangeldievkuu/tdx-taiwan/releases/tag/v0.1.0
