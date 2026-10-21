# Flights (`tdx.air`)

Live airport boards (FIDS, 航班顯示) for departures and arrivals, flight records with both legs,
and the airport and airline reference lists.

## Methods

| Method                                                                | TDX endpoint                                                                                | Returns                    |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------- |
| `tdx.air.airports(query?)`                                            | `GET /v2/Air/Airport`                                                                       | `AirAirport[]`             |
| `tdx.air.airport(iata)`                                               | `GET /v2/Air/Airport/{IATA}`                                                                | `AirAirport`               |
| `tdx.air.airlines(query?)`                                            | `GET /v2/Air/Airline`                                                                       | `AirAirline[]`             |
| `tdx.air.airline(iata)`                                               | `GET /v2/Air/Airline/{IATA}`                                                                | `AirAirline`               |
| `tdx.air.departures(airport?, query?)`                                | `GET /v2/Air/FIDS/Airport/Departure[/{IATA}]`                                               | `AirDeparture[]`           |
| `tdx.air.arrivals(airport?, query?)`                                  | `GET /v2/Air/FIDS/Airport/Arrival[/{IATA}]`                                                 | `AirArrival[]`             |
| `tdx.air.flights(flightNo?, query?)`                                  | `GET /v2/Air/FIDS/Flight[/{FlightNo}]`                                                      | `AirFlight[]`              |
| `tdx.air.boards(airport?, query?)`                                    | `GET /v2/Air/FIDS/Airport[/{IATA}]`                                                         | `AirAirportBoard[]`        |
| `tdx.air.metar(airport?, query?)`                                     | `GET /v2/Air/METAR/Airport[/{IATA}]`                                                        | `AirMetar[]`               |
| `tdx.air.generalSchedule(scope, query?)`                              | `GET /v2/Air/GeneralSchedule/{Domestic\|International}`                                     | `AirGeneralSchedule[]`     |
| `tdx.air.dailySchedule(airline, query?)`                              | `GET /v2/Air/DailyFlightSchedule/Domestic/{IATA}`                                           | `AirDailyFlightSchedule[]` |
| `tdx.air.routeFares(airline, query?)`                                 | `GET /v2/Air/RouteFare/Domestic/{IATA}`                                                     | `AirRouteFare[]`           |
| `tdx.air.seatAvailability(airline, airRoute, date, flightNo, query?)` | `GET /v2/Air/SeatAvailability/Domestic/{IATA}/AirRoute/{R}/FlightDate/{D}/FlightNumber/{N}` | `AirSeatAvailability[]`    |
| `tdx.air.news(query?)`                                                | `GET /v2/Air/News`                                                                          | `AirNews[]`                |

## Example

```ts
// Today's passenger departures from Songshan, with destination names
const [departures, airports] = await Promise.all([
  tdx.air.departures('TSA', { filter: 'IsCargo eq false', orderBy: 'ScheduleDepartureTime' }),
  tdx.air.airports({ select: ['AirportID', 'AirportName'] }),
]);
const nameOf = new Map(airports.map((a) => [a.AirportID, a.AirportName.En]));
for (const d of departures) {
  console.log(d.AirlineID + d.FlightNumber, nameOf.get(d.ArrivalAirportID), d.DepartureRemark);
}

// One flight, both legs. The number is digits only; the airline is a separate field.
const [ci100] = await tdx.air.flights('100', { filter: "AirlineID eq 'CI'" });

// Departures and arrivals of every airport in one call (one element per airport)
const boards = await tdx.air.boards();
```

```ts
// Weather at Taoyuan, today's Mandarin Airlines flights to Kinmen, and the fares for the route
const [[weather], flights, fares] = await Promise.all([
  tdx.air.metar('TPE'),
  tdx.air.dailySchedule('AE', { filter: "FlightDate eq '2026-10-22' and AirRouteID eq 'TSA-KNH'" }),
  tdx.air.routeFares('AE', { filter: "AirRouteID eq 'TSA-KNH'" }),
]);
console.log(weather?.Temperature, weather?.WindSpeed, weather?.WeatherDescription.Zh_tw);
for (const f of flights) console.log(f.FlightNumber, f.DepartureTime, f.FlightRemark || 'ok');
const adult = fares[0]?.Fares.find((f) => f.FareClass === 1);
console.log(adult?.Price);

// Seats left on one of them (slow: TDX asks the airline on every call)
const [seats] = await tdx.air.seatAvailability(
  'AE',
  'TSA-KNH',
  '2026-10-22',
  flights[0]?.FlightNumber ?? '',
);
```

## Notes

- Flight numbers are digits only (`FlightNumber: '100'`, `AirlineID: 'CI'`), and so is the
  `{FlightNo}` path segment: `flights('CI100')` returns nothing. Numbers are shared across
  airlines, so filter on `AirlineID`.
- Flight times (`Schedule…`, `Estimated…`, `Actual…`) are `yyyy-MM-ddTHH:mm` in Taiwan local
  time with no offset; only `UpdateTime` is a full timestamp. `FlightDate` is `yyyy-MM-dd`.
  Songshan (TSA) fills `ActualDepartureTime` with the scheduled time before the flight has left,
  so read the remark (`已飛` / `出發DEPARTED`) rather than the field to tell whether it has gone.
- Remarks are free text from each airport. Taoyuan (TPE) joins Chinese and English in one
  string (`出發DEPARTED`, `準時ON TIME`, `已到ARRIVED`, `取消CANCELLED`); domestic airports use
  Chinese only (`準時`, `報到`, `登機`, `出發`, `已飛`, `抵達`, `延誤`, `取消`, `預計14:00到站`). The
  spec's `DepartureRemarkEn` / `ArrivalRemarkEn`, `FlightStatus*`, `FlightRemark` and `CodeShare`
  fields were never present in live data; `AirRouteType` only appears on `flights`.
- `Terminal`, `Gate` and `CheckCounter` are `""` when unknown, and TPE pads gates (`" A8"`, or
  blanks for a cancelled flight): trim before displaying. Cargo flights (`IsCargo: true`) have an
  `Apron` instead of a `Gate`; filter them out with `IsCargo eq false`.
- TPE lists yesterday, today and tomorrow (about 2,000 departures, 770 KB per call); other
  airports list today. Use `$filter` / `$top` where you can.
- The airport list has 469 airports worldwide, but only the 17 Taiwan airports carry a position,
  address and phone; `AirportCityName` (and once `AirportName`) is `{}` for most others, so
  `AirName` has both parts optional. A few airlines have an empty `AirlineID`.
- `airport(iata)` and `airline(iata)` return one object; an unknown code rejects with a 404
  `TdxApiError`.
- `metar` covers Taiwan's 18 airports (including 東沙 DSX). Every measurement is a string with its
  unit (`"25 KT"`, `"26°C"`, `"9999 M"`), `MetarText` is the raw report, `CityName` is `{}`, and
  an unknown airport yields an empty list.
- `generalSchedule` is the published timetable: `Domestic` has about 1,200 rows (the same flight
  once per validity period), `International` 6,700 rows from 75 airlines (2 MB). `FlightNumber`
  includes the airline code here (`AE1261`), unlike the FIDS records; `CodeShare` is always `[]`.
- `dailySchedule`, `routeFares` and `seatAvailability` exist only for the domestic airlines `AE`
  (華信), `B7` (立榮) and `DA` (德安); any other code is a 400 listing them. AE publishes its
  daily schedule through the end of next month (6,600 rows, 3 MB), B7 about 15 days, DA about 60:
  filter on `FlightDate` and `AirRouteID` (`TSA-KNH`). `FlightRemark` is `X` for a cancelled
  flight; `IsCargo`, `AirFlightType` and the capacity fields are never present. AE's fares all use
  `TicketType: 1` and no `CabinClass`.
- `seatAvailability` is forwarded by TDX to the airline on every call with a 30 s timeout, so it
  is slow and can fail with a 500 `TdxApiError` even for a valid flight; a flight not in the
  daily schedule is a 400. Use a client with `maxRetries: 0` for it if you cannot wait, and note
  B7's limit of 100 calls per half hour per IP.
- `news` is the Civil Aeronautics Administration feed (about 30 items); `AirportID` and
  `AirlineID` are empty strings.

## See also

- [`examples/flight-board.ts`](../examples/flight-board.ts) — `npx tsx examples/flight-board.ts TSA departures` (live departure board of an airport)
- [Conventions](./conventions.md#large-lists-billing-and-caching)

## 繁體中文

航空：`tdx.air.departures('TSA')`／`arrivals('TSA')` 取得機場即時出境／入境航班（FIDS），`flights('100', { filter: "AirlineID eq 'CI'" })` 查詢單一航班（班號僅數字，航空公司另見 `AirlineID`），`boards()` 依機場分組，另有 `airports`／`airport('TPE')` 與 `airlines`／`airline('CI')`。航班時間為臺灣當地時間且不含時區（`yyyy-MM-ddTHH:mm`）；桃園機場的狀態為中英合併字串（如 `出發DEPARTED`），且列出前一日至次日共三天的航班；貨機請以 `IsCargo eq false` 過濾。機場清單含全球 469 座機場，僅臺灣機場有座標。另有 `metar('TPE')`（機場氣象觀測，數值為含單位字串）、`generalSchedule('Domestic' | 'International')`（定期時刻表，班號含航空公司代碼）、`dailySchedule('AE')`／`routeFares('AE')`／`seatAvailability('AE', 'TSA-KNH', date, '1281')`（僅華信 AE、立榮 B7、德安 DA；剩餘座位由 TDX 即時向航空公司查詢，較慢且可能逾時）與 `news()`（民航局最新消息）。
