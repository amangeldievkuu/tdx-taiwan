# Cross-system rail (`tdx.rail`)

The `/v2/Rail/*` feeds that cover every rail system at once: operators, distances between
stations and fares looked up by station **name**. `system` is a TDX rail-system code; Taipei and
New Taipei share `TRTC_NTMC` here (the metro resource uses `TRTC` and `NTMC` separately).

## Methods

| Method                                          | TDX endpoint                                                                           | Returns             |
| ----------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------- |
| `tdx.rail.operators(query?)`                    | `GET /v2/Rail/Operator`                                                                | `RailOperator[]`    |
| `tdx.rail.odDistance(system, query?)`           | `GET /v2/Rail/ODDistance/{RailSystem}`                                                 | `RailODDistance[]`  |
| `tdx.rail.odDistance(system, from, to, query?)` | `GET /v2/Rail/ODDistance/{RailSystem}/{OriginStationName}/to/{DestinationStationName}` | `RailODDistance[]`  |
| `tdx.rail.odFare(system, from, to, query?)`     | `GET /v2/Rail/ODFare/{RailSystem}/{OriginStationName}/to/{DestinationStationName}`     | `RailODFare`        |
| `tdx.rail.s2sDistance(system, query?)`          | `GET /v2/Rail/S2SDistance/{RailSystem}`                                                | `RailS2SDistance[]` |

## Example

```ts
// How far is 板橋 from 西門 on the Taipei metro, and what does it cost?
const [distance] = await tdx.rail.odDistance('TRTC_NTMC', '板橋', '西門');
console.log(distance?.Distance); // 6.54 (km)

const fare = await tdx.rail.odFare('TRTC_NTMC', '板橋', '西門');
for (const f of fare.ODFares ?? []) {
  console.log(f.TicketType, f.FareClass, `NT$${f.Price}`); // 一般票(單程票) 成人 NT$25
}

// Distances between adjacent THSR stations
const [line] = await tdx.rail.s2sDistance('THSR');
console.log(
  line?.Stations?.map(
    (s) => `${s.From.StationName?.Zh_tw}→${s.To.StationName?.Zh_tw} ${s.Distance} km`,
  ),
);
```

## Notes

- Station arguments are names as TDX spells them (`臺北` for TRA, `台北` for THSR, `板橋` for the
  metro), not IDs; the SDK URL-encodes them. An unknown name returns an empty list or an object
  with no `ODFares`.
- `odDistance` and `odFare` accept `TRTC_NTMC`, `KRTC`, `TYMC`, `TMRT`, `NTDLRT`, `NTALRT`,
  `KLRT`, `TRA`, `THSR` (and `AFR` for distances); `TRTC` alone is rejected with a 400.
  `s2sDistance` accepts `TRTC` and `NTMC` separately.
- Shared stations come back with composite IDs in the by-name lookup (`BL07_Y16` for 板橋) and
  plain-string names; `s2sDistance` names are `{ Zh_tw }` only.
- `odFare` labels are free text in Chinese (`一般票`, `成人`, `標準座車廂`), `""` when a field does
  not apply; the typed fare feeds of each resource (`tdx.tra.odFare`, `tdx.thsr.odFare`,
  `tdx.metro.odFare`) use numeric codes instead. The TRA pair 臺北→板橋 returns about 90 fares.
- `operators()` lists nine operators with the shared v2 `Operator` fields (`OperatorNo`,
  `ProviderID`); each mode's own operator feed has more detail.
- Everything is cached with the static TTL.

## See also

- [Metro](./metro.md), [High speed rail](./thsr.md), [Taiwan Railway](./tra.md),
  [Alishan Forest Railway](./afr.md)
- [Conventions](./conventions.md)

## 繁體中文

跨系統軌道資料：`tdx.rail.operators()`（全部軌道營運業者）、`odDistance(system, from?, to?)`（起迄站間距離，站名查詢，臺北／新北捷運代碼為 `TRTC_NTMC`）、`odFare(system, from, to)`（以站名查詢票價，欄位為中文文字）、`s2sDistance(system)`（相鄰站間距離）。
