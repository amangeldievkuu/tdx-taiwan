# Flights (`tdx.air`)

Live airport boards (FIDS, 航班顯示) for departures and arrivals, flight records with both legs,
and the airport and airline reference lists.

## Methods

| Method                                 | TDX endpoint                                  | Returns             |
| -------------------------------------- | --------------------------------------------- | ------------------- |
| `tdx.air.airports(query?)`             | `GET /v2/Air/Airport`                         | `AirAirport[]`      |
| `tdx.air.airport(iata)`                | `GET /v2/Air/Airport/{IATA}`                  | `AirAirport`        |
| `tdx.air.airlines(query?)`             | `GET /v2/Air/Airline`                         | `AirAirline[]`      |
| `tdx.air.airline(iata)`                | `GET /v2/Air/Airline/{IATA}`                  | `AirAirline`        |
| `tdx.air.departures(airport?, query?)` | `GET /v2/Air/FIDS/Airport/Departure[/{IATA}]` | `AirDeparture[]`    |
| `tdx.air.arrivals(airport?, query?)`   | `GET /v2/Air/FIDS/Airport/Arrival[/{IATA}]`   | `AirArrival[]`      |
| `tdx.air.flights(flightNo?, query?)`   | `GET /v2/Air/FIDS/Flight[/{FlightNo}]`        | `AirFlight[]`       |
| `tdx.air.boards(airport?, query?)`     | `GET /v2/Air/FIDS/Airport[/{IATA}]`           | `AirAirportBoard[]` |

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

## See also

- [`examples/flight-board.ts`](../examples/flight-board.ts) — `npx tsx examples/flight-board.ts TSA departures` (live departure board of an airport)
- [Conventions](./conventions.md#large-lists-billing-and-caching)

## 繁體中文

航空：`tdx.air.departures('TSA')`／`arrivals('TSA')` 取得機場即時出境／入境航班（FIDS），`flights('100', { filter: "AirlineID eq 'CI'" })` 查詢單一航班（班號僅數字，航空公司另見 `AirlineID`），`boards()` 依機場分組，另有 `airports`／`airport('TPE')` 與 `airlines`／`airline('CI')`。航班時間為臺灣當地時間且不含時區（`yyyy-MM-ddTHH:mm`）；桃園機場的狀態為中英合併字串（如 `出發DEPARTED`），且列出前一日至次日共三天的航班；貨機請以 `IsCargo eq false` 過濾。機場清單含全球 469 座機場，僅臺灣機場有座標。
