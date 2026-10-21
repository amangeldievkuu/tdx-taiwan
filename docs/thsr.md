# High speed rail (`tdx.thsr`)

Stations are identified by ID: `0990` 南港, `1000` 台北, `1010` 板橋, `1020` 桃園, `1030` 新竹,
`1035` 苗栗, `1040` 台中, `1043` 彰化, `1047` 雲林, `1050` 嘉義, `1060` 台南, `1070` 左營.

## Methods

| Method                                        | TDX endpoint                                                 | Returns              |
| --------------------------------------------- | ------------------------------------------------------------ | -------------------- |
| `tdx.thsr.stations(query?)`                   | `GET /v2/Rail/THSR/Station`                                  | `ThsrStation[]`      |
| `tdx.thsr.timetable(from, to, date?, query?)` | `GET /v2/Rail/THSR/DailyTimetable/OD/{O}/to/{D}/{TrainDate}` | `ThsrODTimetable[]`  |
| `tdx.thsr.odFare(from, to, query?)`           | `GET /v2/Rail/THSR/ODFare/{O}/to/{D}`                        | `ThsrODFare[]`       |
| `tdx.thsr.availableSeats(station, query?)`    | `GET /v2/Rail/THSR/AvailableSeatStatusList/{StationID}`      | `ThsrAvailableSeats` |
| `tdx.thsr.alerts(query?)`                     | `GET /v2/Rail/THSR/AlertInfo`                                | `ThsrAlert[]`        |

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

## See also

- [`examples/thsr-trains.ts`](../examples/thsr-trains.ts) — `npx tsx examples/thsr-trains.ts 1000 1070` (today's THSR trains with fares)
- [Conventions](./conventions.md#dates)
- [Taiwan Railway](./tra.md)

## 繁體中文

高鐵：`tdx.thsr.timetable('1000', '1070', '2026-10-21')` 查詢指定日期起迄站時刻表（日期可為 `Date` 或 `YYYY-MM-DD`，預設為臺灣時間今天；僅提供約四週內的資料），另有 `odFare`（票價）、`availableSeats`（對號座剩餘座位：O 尚有、L 有限、X 已無）與 `alerts`（營運通阻）。
