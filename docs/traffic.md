# Road traffic (`tdx.traffic`)

Road sections with live speed, travel time and congestion level, the congestion scales, traffic
cameras, vehicle detectors with live lane flows, eTag gantry pairs with live travel times, traffic
news and road events. Every kind comes by city, for the national freeways
(`tdx.traffic.freeway.*`, 高速公路局) and for the provincial highways (`tdx.traffic.highway.*`,
公路局).

## Methods

| Method                                       | TDX endpoint                                                  | Returns                   |
| -------------------------------------------- | ------------------------------------------------------------- | ------------------------- |
| `tdx.traffic.sections(city, query?)`         | `GET /v2/Road/Traffic/Section/City/{City}`                    | `TrafficSections`         |
| `tdx.traffic.liveTraffic(city, query?)`      | `GET /v2/Road/Traffic/Live/City/{City}`                       | `TrafficLiveTraffics`     |
| `tdx.traffic.congestionLevels(city, query?)` | `GET /v2/Road/Traffic/CongestionLevel/City/{City}`            | `TrafficCongestionLevels` |
| `tdx.traffic.cctvs(city, query?)`            | `GET /v2/Road/Traffic/CCTV/City/{City}`                       | `TrafficCCTVs`            |
| `tdx.traffic.vds(city, query?)`              | `GET /v2/Road/Traffic/VD/City/{City}`                         | `TrafficVDs`              |
| `tdx.traffic.vdLive(city, query?)`           | `GET /v2/Road/Traffic/Live/VD/City/{City}`                    | `TrafficVDLives`          |
| `tdx.traffic.etagPairs(city, query?)`        | `GET /v2/Road/Traffic/ETagPair/City/{City}`                   | `TrafficETagPairs`        |
| `tdx.traffic.etagPairLive(city, query?)`     | `GET /v2/Road/Traffic/Live/ETag/City/{City}`                  | `TrafficETagPairLives`    |
| `tdx.traffic.news(city, query?)`             | `GET /v2/Road/Traffic/Live/News/City/{City}`                  | `TrafficNewsList`         |
| `tdx.traffic.events(city, query?)`           | `GET /v1/Traffic/RoadEvent/Event/City/{City}`                 | `TrafficEvents`           |
| `tdx.traffic.liveEvents(city, query?)`       | `GET /v1/Traffic/RoadEvent/LiveEvent/City/{City}`             | `TrafficLiveEvents`       |
| `tdx.traffic.authorities(query?)`            | `GET /v2/Road/Traffic/Basic/Authority`                        | `TrafficAuthorities`      |
| `tdx.traffic.freeway.*(query?)`              | The same at `…/Freeway`, without `events` and `authorities`   | same types                |
| `tdx.traffic.highway.*(query?)`              | The same at `…/Highway`, with `events()` but no `authorities` | same types                |

## Example

```ts
// Congested freeway sections right now, with the level name from the congestion scale
const [{ Sections: sections }, { LiveTraffics: live }, { CongestionLevels: scales }] =
  await Promise.all([
    tdx.traffic.freeway.sections(),
    tdx.traffic.freeway.liveTraffic({ filter: "CongestionLevel ge '3'" }),
    tdx.traffic.freeway.congestionLevels(),
  ]);
const sectionById = new Map(sections.map((s) => [s.SectionID, s]));
const levelName = new Map(
  scales.flatMap((s) => s.Levels.map((l) => [`${s.CongestionLevelID}:${l.Level}`, l.LevelName])),
);
for (const t of live) {
  const section = sectionById.get(t.SectionID ?? '');
  const level = levelName.get(`${t.CongestionLevelID}:${t.CongestionLevel}`);
  console.log(section?.SectionName, `${t.TravelSpeed} km/h`, level);
}

// Live incidents in Taipei, and the freeway cameras near Linkou
const { LiveEvents: incidents } = await tdx.traffic.liveEvents('Taipei', {
  filter: 'EventType eq 1',
});
const { CCTVs: cameras } = await tdx.traffic.freeway.cctvs({
  filter: "contains(RoadName, '國道1號')",
});
```

## Notes

- Every response is a wrapper object whose array is named per kind (`Sections`, `LiveTraffics`,
  `CongestionLevels`, `CCTVs`, `VDs`, `VDLives`, `ETagPairs`, `ETagPairLives`, `Newses`, `Events`,
  `LiveEvents`) rather than the spec's `Items`, and `Count` is never sent. Queries apply to the
  items. Join live traffic to sections on `SectionID`, detector readings on `VDID` and eTag
  travel times on `ETagPairID`. The join is loose: 224 of 680 freeway live rows use four-digit
  IDs (`0475`…) that no published section has, so keep rows whose section is unknown.
- **Each kind accepts its own cities** (an unsupported one gets a 400 listing the accepted
  ones, see [Conventions](./conventions.md#cities-and-route-names)). Sections, cameras and news take the
  spec's 14 cities plus NewTaipei; live traffic only YilanCounty, ChanghuaCounty, YunlinCounty,
  PingtungCounty, Keelung, Taipei, Taichung, Tainan and Taoyuan; detectors the spec's 14; eTag
  pairs 13 cities without Taipei (incl. NewTaipei, Hsinchu, Chiayi); events Taipei, NewTaipei,
  Taoyuan, Taichung, Tainan, Keelung, MiaoliCounty, ChiayiCounty, PingtungCounty, YilanCounty and
  KinmenCounty, live events also Kaohsiung. The freeways have no announced-events feed.
- `CongestionLevel` is a **string** (`"3"`) whose meaning depends on the scale in
  `congestionLevels` (`CongestionLevelID`): the freeways use one scale `A` with levels 1-5 by
  speed, Taipei one per road class with levels 1-6 (`A`-`F`). `"0"` is unknown, `"-1"` closed and
  `"-99"` bad data (8 of 818 Taipei sections); `TravelTime` and `TravelSpeed` are `-99` or `-1`
  then too. Detector speeds and volumes also use `-99`.
- Detector readings list vehicles by class code string (`S` car, `L` large, `T` truck, `M`
  motorcycle); eTag flows use the spec's integer class codes. Taipei cameras send
  `SurveillanceType: -1`, so that field is a plain number.
- The freeway and highway news feeds omit `Description` (required by the spec) and send
  `0001-01-01T00:00:00+08:06` as `UpdateTime`. `LinkVersion` is sent only by the freeway and
  highway authorities (`NFB`, `THB`).
- Full lists are large: 818 Taipei and 680 freeway live sections (about 260 KB each), 456 freeway
  sections (250 KB), 384 Taipei cameras (110 KB). Static kinds refresh every 6 hours, live kinds
  every minute, so cache the static ones and filter the live ones.
- TDX restricts the CCTV endpoints to API keys (no guest access). CMS signs, eTag gantries,
  section geometry (`SectionLink`, `SectionShape`) and the by-ID endpoints are not wrapped yet;
  use `tdx.get` or `$filter`.

## See also

- [`examples/road-traffic.ts`](../examples/road-traffic.ts) — `npx tsx examples/road-traffic.ts freeway` (most congested freeway sections and live events)
- [Conventions](./conventions.md#cities-and-route-names)

## 繁體中文

路況：`tdx.traffic.liveTraffic('Taipei')` 取得路段即時速率、旅行時間與壅塞程度，`sections`（發布路段）、`congestionLevels`（壅塞水準定義）、`cctvs`（攝影機）、`vds`／`vdLive`（車輛偵測器與即時車流）、`etagPairs`／`etagPairLive`（eTag 配對路段與即時旅行時間）、`news`、`events`（預告性事件）與 `liveEvents`（即時事件）；國道使用 `tdx.traffic.freeway.*`，省道使用 `tdx.traffic.highway.*`。回應為包裝物件，陣列依種類命名（`Sections`、`LiveTraffics`…）。各種類支援的縣市不同（如 eTag 不含臺北市、即時路況僅 9 個縣市），不支援時 TDX 回傳 400 並列出可用縣市。`CongestionLevel` 為字串，級別名稱需對應 `congestionLevels`；`-99` 表示資料異常、`-1` 表示道路封閉。
