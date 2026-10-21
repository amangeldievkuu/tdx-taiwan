# Taiwan Railway (`tdx.tra`)

TRA methods use the TDX **v3** API. Stations have 4-digit IDs, e.g. `0900` 基隆, `1000` 臺北,
`1020` 板橋, `1210` 新竹, `3300` 臺中, `4220` 臺南, `4400` 高雄, `7000` 花蓮, `7190` 宜蘭;
`tdx.tra.stations()` lists all of them.

## Methods

| Method                                       | TDX endpoint                                                     | Returns                |
| -------------------------------------------- | ---------------------------------------------------------------- | ---------------------- |
| `tdx.tra.stations(query?)`                   | `GET /v3/Rail/TRA/Station`                                       | `TraStations`          |
| `tdx.tra.timetable(from, to, date?, query?)` | `GET /v3/Rail/TRA/DailyTrainTimetable/OD/{O}/to/{D}/{TrainDate}` | `TraTimetable`         |
| `tdx.tra.odFare(from, to, query?)`           | `GET /v3/Rail/TRA/ODFare/{O}/to/{D}`                             | `TraODFares`           |
| `tdx.tra.liveBoard(station, query?)`         | `GET /v3/Rail/TRA/StationLiveBoard/Station/{StationID}`          | `TraStationLiveBoards` |
| `tdx.tra.trainLiveBoard(trainNo, query?)`    | `GET /v3/Rail/TRA/TrainLiveBoard/TrainNo/{TrainNo}`              | `TraTrainLiveBoards`   |
| `tdx.tra.alerts(query?)`                     | `GET /v3/Rail/TRA/Alert`                                         | `TraAlerts`            |

## Example

```ts
// Tomorrow's trains from Taipei to Kaohsiung, with the adult fare for each train's type
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
const [timetable, fares] = await Promise.all([
  tdx.tra.timetable('1000', '4400', tomorrow),
  tdx.tra.odFare('1000', '4400'),
]);

for (const {
  TrainInfo: info,
  StopTimes: [from, to],
} of timetable.TrainTimetables ?? []) {
  // TRA lines form a ring: match the fare on train type *and* direction.
  const fare = fares.ODFares.find(
    (f) => String(f.TrainType) === info.TrainTypeCode && f.Direction === info.Direction,
  )?.Fares.find((p) => p.TicketType === 1 && p.FareClass === 1);
  console.log(
    info.TrainNo,
    info.TrainTypeName.Zh_tw,
    from?.DepartureTime,
    '→',
    to?.ArrivalTime,
    fare?.Price,
  );
}

// Is my train late? Where is it now?
const {
  TrainLiveBoards: [now],
} = await tdx.tra.trainLiveBoard('103');
console.log(now?.StationName.Zh_tw, `${now?.DelayTime} min late`);
```

## Notes

- Every TRA response is a wrapper object (`{ UpdateTime, …, Stations }`, `{ …, TrainTimetables }`,
  …); queries apply to the items inside it.
- Names use `TraNameType`: every field is optional and Korean is `Kr`, not `Ko`.
- `odFare` returns one entry per train type **and direction**. 臺北 → 高雄 by 自強 costs NT$994
  the short way (`Direction` 1, 371 km) and NT$1286 around the east coast (`Direction` 0), so
  match the train's `TrainInfo.Direction`. Live data also uses train type `11` (自強 3000),
  which the spec does not list.
- Timetable times are `HH:mm`; live board scheduled times are `HH:mm:ss`. Timetables are
  published about two months ahead; `date` works as for [THSR](./thsr.md) (`trainDate()`).
- `liveBoard(station)` lists only trains about to arrive or depart (with `Platform`,
  `DelayTime` in minutes and `RunningStatus`); use `timetable` for planning.
- Where live data departs from the spec, the types follow the data: the timetable and fare
  wrappers have no `AuthorityCode`, and the normal-day alert has no `AlertID` or `Description`.

## See also

- [`examples/tra-trains.ts`](../examples/tra-trains.ts) — `npx tsx examples/tra-trains.ts 1000 4400` (today's TRA trains with fares)
- [Conventions](./conventions.md#dates)
- [High speed rail](./thsr.md)

## 繁體中文

臺鐵（TDX v3）：`tdx.tra.timetable('1000', '4400', '2026-10-22')` 查詢起迄站時刻表，另有 `stations`、`odFare`（票價，依車種**及行駛方向**區分：臺北→高雄自強號順向 371 公里 994 元，經東部環島方向 1286 元）、`liveBoard`（車站即時到離站，含月台與延誤分鐘）、`trainLiveBoard`（列車即時位置）與 `alerts`。回應皆為包裝物件，名稱欄位使用 `TraNameType`（韓文為 `Kr`）。
