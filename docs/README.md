# tdx-taiwan documentation

One page per resource, plus the rules they share. The [README](../README.md) covers install,
auth, the query builder, client options and errors.

| Resource                           | Namespace     | Scope                                                             | Example                                                      |
| ---------------------------------- | ------------- | ----------------------------------------------------------------- | ------------------------------------------------------------ |
| [Public bikes](./bike.md)          | `tdx.bike`    | YouBike / Moovo stations and live availability                    | [`nearest-youbike.ts`](../examples/nearest-youbike.ts)       |
| [Buses](./bus.md)                  | `tdx.bus`     | City and InterCity routes, stops, ETAs and live positions         | —                                                            |
| [Metro](./metro.md)                | `tdx.metro`   | Stations, lines, live boards, first/last trains, fares, alerts    | [`next-metro-train.ts`](../examples/next-metro-train.ts)     |
| [High speed rail](./thsr.md)       | `tdx.thsr`    | Stations, timetables, fares, seat availability, alerts            | [`thsr-trains.ts`](../examples/thsr-trains.ts)               |
| [Taiwan Railway](./tra.md)         | `tdx.tra`     | Stations, timetables, fares, live boards, train positions, alerts | [`tra-trains.ts`](../examples/tra-trains.ts)                 |
| [Alishan Forest Railway](./afr.md) | `tdx.afr`     | Stations, lines, routes, regular timetable, fares, news           | [`alishan-timetable.ts`](../examples/alishan-timetable.ts)   |
| [Cross-system rail](./rail.md)     | `tdx.rail`    | Operators, station distances and by-name fares across systems     | —                                                            |
| [Parking](./parking.md)            | `tdx.parking` | Car parks and curbside segments with live free spaces             | [`nearest-parking.ts`](../examples/nearest-parking.ts)       |
| [EV charging](./ev.md)             | `tdx.ev`      | Stations, chargers, connectors, live status, prices               | [`nearest-ev-charger.ts`](../examples/nearest-ev-charger.ts) |
| [Flights](./air.md)                | `tdx.air`     | Airports, airlines, live departure and arrival boards             | [`flight-board.ts`](../examples/flight-board.ts)             |
| [Road traffic](./traffic.md)       | `tdx.traffic` | Live section speeds, cameras, detectors, eTag, events             | [`road-traffic.ts`](../examples/road-traffic.ts)             |
| [Ferries](./ship.md)               | `tdx.ship`    | Ports, routes, timetables, fares, live boards, AIS positions      | [`ferry-departures.ts`](../examples/ferry-departures.ts)     |

- [Conventions](./conventions.md) — field names, wrapper objects, cities, dates, large lists.
- [Caching](./caching.md) — the in-memory cache and keeping static data on disk
  (`tdx-taiwan/file-cache`).
- [NestJS](./nestjs.md) — the `tdx-taiwan/nestjs` module.
- [Contributing](../CONTRIBUTING.md) — scripts, fetching a TDX spec, fixtures, releases.
