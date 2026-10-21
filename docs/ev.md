# EV charging (`tdx.ev`)

Charging stations, their charging points and connectors (plugs), live connector status and
charging prices, by city or for freeway service areas (`tdx.ev.freeway.*`).

## Methods

| Method                                | TDX endpoint                                 | Returns            |
| ------------------------------------- | -------------------------------------------- | ------------------ |
| `tdx.ev.stations(city, query?)`       | `GET /v1/EV/Station/City/{City}`             | `EvStations`       |
| `tdx.ev.chargingPoints(city, query?)` | `GET /v1/EV/ChargingPoint/City/{City}`       | `EvChargingPoints` |
| `tdx.ev.connectors(city, query?)`     | `GET /v1/EV/Connector/City/{City}`           | `EvConnectors`     |
| `tdx.ev.liveStatus(city, query?)`     | `GET /v1/EV/ConnectorLiveStatus/City/{City}` | `EvLiveStatuses`   |
| `tdx.ev.chargingRates(city, query?)`  | `GET /v1/EV/ChargingRate/City/{City}`        | `EvChargingRates`  |
| `tdx.ev.freeway.*(query?)`            | The same five, at `…/Freeway/ServiceArea`    | same types         |

## Example

```ts
// Free DC fast chargers (CCS2) in Taipei right now
const [{ Stations: stations }, { LiveStatuses: live }, { Connectors: connectors }] =
  await Promise.all([
    tdx.ev.stations('Taipei'),
    tdx.ev.liveStatus('Taipei', { filter: 'ConnectorStatus eq 1 and ConnectorType eq 2' }),
    tdx.ev.connectors('Taipei', { filter: 'Power eq 2' }), // 2 = DC
  ]);
// Join in code: the ID fields cannot be used in OData queries.
const dc = new Map(connectors.map((c) => [c.ConnectorID, c]));
const stationById = new Map(stations.map((s) => [s.StationID, s]));
for (const status of live) {
  const connector = dc.get(status.ConnectorID);
  const station = connector && stationById.get(connector.StationID);
  if (connector && station) console.log(station.StationName.Zh_tw, connector.PowerRating);
}

// Along the freeway
const { Stations: serviceAreas } = await tdx.ev.freeway.stations();
```

## Notes

- Join the lists on `StationID`, `ChargingPointID` and `ConnectorID`. Live data has these IDs
  although the spec omits them (`StationID` on stations, `ChargingPointID` on charging points,
  `ConnectorID` on connectors, statuses and rates); the types include them. Because they are not
  in TDX's query model, **they cannot be used in `$filter`, `$select` or `$orderby`** (TDX
  answers 400): fetch the lists and join in code. ID formats vary by operator.
- Join a live status to its connector on `ConnectorID`, then to the station via the
  **connector's** `StationID`. A status's own `StationID` can use another ID scheme (227 of
  1,628 in Taipei, e.g. `TPE0117` instead of `33029464-STP6780001`).
- Some lists are incomplete: Taichung publishes 261 connectors for 1,531 live statuses. Treat a
  missing connector as unknown details, not a missing charger.
- `ConnectorStatus`: 1 free, 2 in use, 3 out of order. Connector `Type`: 1 CCS1, 2 CCS2,
  3 CHAdeMO, 4 Tesla TPC, 5 J1772 (Type 1), 6 Mennekes (Type 2); `Power`: 1 AC, 2 DC.
- `PowerRating`, `Voltage` and `CurrentRating` are text (`"7KW"`, `"220V"`, `"32A"`), as are a
  station's `ServiceTime`, `ParkingRate` and `ChargingRate`. Structured prices are in
  `chargingRates` (`RateType`: 1 free, 2 per kWh, 3 per minute, 4 per hour).
- A station's `Reference` can point to a car park or on-street segment from [`tdx.parking`](./parking.md).

## See also

- [`examples/nearest-ev-charger.ts`](../examples/nearest-ev-charger.ts) — `npx tsx examples/nearest-ev-charger.ts 25.0478 121.5170 Taipei 2` (nearest free CCS2 chargers)
- [Conventions](./conventions.md)
- [Parking](./parking.md)

## 繁體中文

電動車充電：`tdx.ev.stations('Taipei')`（充電站）、`chargingPoints`（充電樁）、`connectors`（充電槍）、`liveStatus`（充電槍即時狀態：1 可使用、2 使用中、3 故障）與 `chargingRates`（費率）；高速公路服務區使用 `tdx.ev.freeway.*`。各清單以 `StationID`、`ChargingPointID`、`ConnectorID` 對應（規格未列出這些欄位，但實際資料皆有；這些欄位無法用於 `$filter`／`$select`，請於程式中對應）。即時狀態請先以 `ConnectorID` 對應充電槍，再以充電槍的 `StationID` 對應充電站（即時狀態本身的 `StationID` 可能使用另一套代碼）。
