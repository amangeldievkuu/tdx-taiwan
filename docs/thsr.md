# High speed rail (`tdx.thsr`)

Stations are identified by ID: `0990` 南港, `1000` 台北, `1010` 板橋, `1020` 桃園, `1030` 新竹,
`1035` 苗栗, `1040` 台中, `1043` 彰化, `1047` 雲林, `1050` 嘉義, `1060` 台南, `1070` 左營.

## Methods

| Method                                              | TDX endpoint                                                               | Returns                  |
| --------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------ |
| `tdx.thsr.stations(query?)`                         | `GET /v2/Rail/THSR/Station`                                                | `ThsrStation[]`          |
| `tdx.thsr.timetable(from, to, date?, query?)`       | `GET /v2/Rail/THSR/DailyTimetable/OD/{O}/to/{D}/{TrainDate}`               | `ThsrODTimetable[]`      |
| `tdx.thsr.odFare(from, to, query?)`                 | `GET /v2/Rail/THSR/ODFare/{O}/to/{D}`                                      | `ThsrODFare[]`           |
| `tdx.thsr.availableSeats(station?, query?)`         | `GET /v2/Rail/THSR/AvailableSeatStatusList[/{StationID}]`                  | `ThsrAvailableSeats`     |
| `tdx.thsr.alerts(query?)`                           | `GET /v2/Rail/THSR/AlertInfo`                                              | `ThsrAlert[]`            |
| `tdx.thsr.generalTimetable(trainNo?, query?)`       | `GET /v2/Rail/THSR/GeneralTimetable[/TrainNo/{TrainNo}]`                   | `ThsrGeneralTimetable[]` |
| `tdx.thsr.dailyTimetable(date?, query?)`            | `GET /v2/Rail/THSR/DailyTimetable/TrainDate/{TrainDate}`                   | `ThsrDailyTimetable[]`   |
| `tdx.thsr.trainTimetable(trainNo, date?, query?)`   | `GET /v2/Rail/THSR/DailyTimetable/TrainNo/{TrainNo}/TrainDate/{TrainDate}` | `ThsrDailyTimetable[]`   |
| `tdx.thsr.stationTimetable(station, date?, query?)` | `GET /v2/Rail/THSR/DailyTimetable/Station/{StationID}/{TrainDate}`         | `ThsrStationTimetable[]` |
| `tdx.thsr.trainDates(query?)`                       | `GET /v2/Rail/THSR/DailyTimetable/TrainDates`                              | `ThsrTrainDates`         |
| `tdx.thsr.news(query?)`                             | `GET /v2/Rail/THSR/News`                                                   | `ThsrNews[]`             |
| `tdx.thsr.stationExits(query?)`                     | `GET /v2/Rail/THSR/StationExit`                                            | `ThsrStationExit[]`      |

## Example

```ts
import { query, type ThsrODTimetable } from 'tdx-taiwan';

// Evening trains from Taipei to Zuoying tomorrow, with the standard adult fare
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
const trains = await tdx.thsr.timetable(
  '1000',
  '1070',
  tomorrow,
  query<ThsrODTimetable>().filter("OriginStopTime/DepartureTime ge '18:00'"),
);
const [od] = await tdx.thsr.odFare('1000', '1070');
const standard = od?.Fares.find(
  (f) => f.TicketType === 1 && f.FareClass === 1 && f.CabinClass === 1,
);

for (const t of trains) {
  console.log(
    t.DailyTrainInfo.TrainNo,
    t.OriginStopTime.DepartureTime,
    '→',
    t.DestinationStopTime.ArrivalTime,
  );
}
console.log(`NT$${standard?.Price}`); // NT$1490

// Seats left on trains leaving Taipei: O = available, L = limited, X = sold out
const board = await tdx.thsr.availableSeats('1000');
```

## Notes

- `date` is a `Date` or a `'YYYY-MM-DD'` string and defaults to today. A `Date` is read as the
  calendar day in Taiwan (UTC+8), whatever the machine's time zone; `trainDate()` exposes the
  same conversion for `tdx.get` paths.
- TDX only publishes timetables about four weeks ahead; later dates fail with a `TdxApiError`
  (400).
- Times are `HH:mm`, although the spec says `HH:mm:ss`.
- `availableSeats` returns an object (`{ UpdateTime, AvailableSeats }`); the query filters the
  `AvailableSeats` items. During disruptions THSR freezes the board at the last normal state.
- `alerts` returns a single "全線營運正常(Normal)" record with an empty `Status` on a normal day.
- Timetables: `timetable(from, to, date)` is the station-pair view; `dailyTimetable(date)` every
  train's full stop list for a day, `trainTimetable(trainNo, date)` one train's, and
  `stationTimetable(station, date)` every train calling at a station. `generalTimetable(trainNo?)`
  is the regular timetable with weekdays (`ServiceDay` uses 0/1), an `EffectiveDate` and an
  `ExpiringDate` that is `""` while open-ended. `trainDates()` lists the covered dates (about
  four weeks). Dates default to today in Taiwan.
- `availableSeats()` without a station returns the board for every station. `stationExits()`
  gives each exit's position and accessibility flags. `news()` items carry HTML with inline CSS
  in `Description` and a free-text `NewsCategory`. Not wrapped: shapes, stations of line, the
  OD seat-status feeds and free-seating cars; use `tdx.get`.

## See also

- [`examples/thsr-trains.ts`](../examples/thsr-trains.ts) — `npx tsx examples/thsr-trains.ts 1000 1070` (today's THSR trains with fares)
- [Conventions](./conventions.md#dates)
- [Taiwan Railway](./tra.md)

## 繁體中文

高鐵：`tdx.thsr.timetable('1000', '1070', '2026-10-21')` 查詢指定日期起迄站時刻表（日期可為 `Date` 或 `YYYY-MM-DD`，預設為臺灣時間今天；僅提供約四週內的資料），另有 `odFare`（票價）、`availableSeats`（對號座剩餘座位：O 尚有、L 有限、X 已無）與 `alerts`（營運通阻）。時刻表另有 `dailyTimetable(date?)`（當日全部車次）、`trainTimetable(trainNo, date?)`、`stationTimetable(station, date?)`（站別時刻表）、`generalTimetable(trainNo?)`（定期時刻表）與 `trainDates()`（可查日期）；`availableSeats()` 不帶車站可取得全部車站看板；另有 `news()` 與 `stationExits()`。
