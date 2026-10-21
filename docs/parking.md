# Parking (`tdx.parking`)

Off-street car parks and on-street (curbside) segments, each with a live availability list.

## Methods

| Method                                          | TDX endpoint                                                      | Returns                        |
| ----------------------------------------------- | ----------------------------------------------------------------- | ------------------------------ |
| `tdx.parking.carParks(city, query?)`            | `GET /v1/Parking/OffStreet/CarPark/City/{City}`                   | `ParkingCarParks`              |
| `tdx.parking.availability(city, query?)`        | `GET /v1/Parking/OffStreet/ParkingAvailability/City/{City}`       | `ParkingAvailabilities`        |
| `tdx.parking.segments(city, query?)`            | `GET /v1/Parking/OnStreet/ParkingSegment/City/{City}`             | `ParkingSegments`              |
| `tdx.parking.segmentAvailability(city, query?)` | `GET /v1/Parking/OnStreet/ParkingSegmentAvailability/City/{City}` | `ParkingSegmentAvailabilities` |

## Example

```ts
// Open car parks in Taipei with free car spaces right now
const [{ CarParks: carParks }, { ParkingAvailabilities: live }] = await Promise.all([
  tdx.parking.carParks('Taipei'),
  tdx.parking.availability('Taipei', { filter: 'ServiceStatus eq 1 and AvailableSpaces gt 0' }),
]);
const byId = new Map(carParks.map((c) => [c.CarParkID, c]));
for (const a of live) {
  const carPark = byId.get(a.CarParkID);
  if (carPark) console.log(carPark.CarParkName.Zh_tw, a.AvailableSpaces, carPark.Address);
}

// On-street: free curbside spaces per segment
const { CurbParkingSegmentAvailabilities: curb } = await tdx.parking.segmentAvailability('Taipei');
```

## Notes

- Responses are wrapper objects. The spec names every array `Items`, but TDX returns
  `CarParks`, `ParkingAvailabilities`, `ParkingSegments` and `CurbParkingSegmentAvailabilities`;
  the types follow the live data. Queries apply to the items.
- **The lists join only partly.** In Taipei, 455 of 1,180 availability records match a car park,
  and some car parks flagged `LiveOccuppancyAvailable` have no availability record. Treat a
  missing match as "unknown", not "full".
- Coverage differs per city: car parks exist for 21 cities but not NewTaipei (which has
  on-street data only). A city without data returns an empty list, not an error.
- `Occupancy` is a string ratio (`"0.56"`), `Geometry` is WKT, and the `Availabilities` array
  breaks spaces down by `SpaceType` (1 = car, 2 = scooter, …).
- Several fields the spec marks required are missing in live data and are optional here (for
  example `Telephone`, `Email`, `TownName`), as are the wrapper's `UpdateTime` and
  `AuthorityCode` for cities without data.
- The lists are large (Taichung has 1,414 car parks); filter or `$select` where you can.

## See also

- [`examples/nearest-parking.ts`](../examples/nearest-parking.ts) — `npx tsx examples/nearest-parking.ts 25.0478 121.5170` (5 nearest car parks with free spaces)
- [Conventions](./conventions.md#large-lists-billing-and-caching)
- [EV charging](./ev.md) — a station's `Reference` can point at a car park

## 繁體中文

停車：`tdx.parking.carParks('Taipei')`（路外停車場）、`availability`（即時剩餘車位）、`segments`（路邊停車路段）與 `segmentAvailability`（路段即時剩餘車位）。停車場與剩餘車位以 `CarParkID` 對應，但兩份清單僅部分重疊（臺北 1,180 筆剩餘車位中僅 455 筆有對應停車場）；新北市僅有路邊停車資料，無資料的縣市回傳空清單。
