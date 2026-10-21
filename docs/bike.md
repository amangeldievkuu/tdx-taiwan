# Public bikes (`tdx.bike`)

YouBike and Moovo rental stations and their live bike and dock counts, by city (`BikeCity`:
Taipei, NewTaipei, Taoyuan, Taichung, Tainan, Kaohsiung, Hsinchu, HsinchuCounty, MiaoliCounty,
ChanghuaCounty, YunlinCounty, Chiayi, ChiayiCounty, PingtungCounty, TaitungCounty).

## Methods

| Method                                | TDX endpoint                            | Returns              |
| ------------------------------------- | --------------------------------------- | -------------------- |
| `tdx.bike.stations(city, query?)`     | `GET /v2/Bike/Station/City/{City}`      | `BikeStation[]`      |
| `tdx.bike.availability(city, query?)` | `GET /v2/Bike/Availability/City/{City}` | `BikeAvailability[]` |

## Example

```ts
import { TdxClient, query, type BikeAvailability } from 'tdx-taiwan';

// Every station's live count
const bikes = await tdx.bike.availability('Taipei');
console.log(bikes[0]?.StationUID, bikes[0]?.AvailableRentBikes);

// The 10 stations with the most bikes right now
const top = await tdx.bike.availability(
  'Taipei',
  query<BikeAvailability>()
    .filter('ServiceStatus eq 1')
    .filter('AvailableRentBikes gt 0') // multiple filters are combined with `and`
    .select('StationUID', 'AvailableRentBikes', 'AvailableReturnBikes')
    .orderBy('AvailableRentBikes', 'desc')
    .top(10),
);

// Station details (name, position, capacity) to join on StationUID
const stations = await tdx.bike.stations('Taipei');
```

## Notes

- Both endpoints return arrays. Join `availability` to `stations` on `StationUID`.
- `stations` is cached with the static TTL (1 hour), `availability` with the real-time TTL
  (15 seconds) when `cache: true` is set.
- `ServiceType`: 1 = YouBike 1.0, 2 = YouBike 2.0, 3 = Moovo. `ServiceStatus`: 0 = out of
  service, 1 = operating, 2 = suspended. `AvailableRentBikesDetail` splits the count into
  `GeneralBikes` and `ElectricBikes`.
- Most fields are optional and nullable in the spec (a suspended station reports `null`
  availability); the types say so.

## See also

- [`examples/nearest-youbike.ts`](../examples/nearest-youbike.ts) — `npx tsx examples/nearest-youbike.ts 25.0478 121.5170` (5 nearest YouBike stations with bikes)
- [Conventions](./conventions.md)

## 繁體中文

公共自行車：`tdx.bike.stations('Taipei')` 取得站點（名稱、座標、車柱數），`availability('Taipei')` 取得即時可借／可還車數；兩者以 `StationUID` 對應。`ServiceType` 1 = YouBike 1.0、2 = YouBike 2.0、3 = Moovo；`ServiceStatus` 0 = 停止營運、1 = 正常營運、2 = 暫停營運。
