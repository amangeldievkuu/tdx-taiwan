/**
 * Prints the most congested road sections of a road network right now, then its live events.
 *
 *   cp .env.example .env   # add your TDX keys
 *   npx tsx examples/road-traffic.ts [freeway|highway|<City>]
 *
 * Defaults to the national freeways. `highway` is the provincial highways; a city name such as
 * `Taipei`, `Taoyuan` or `Taichung` uses that city's feeds (live traffic exists for YilanCounty,
 * ChanghuaCounty, YunlinCounty, PingtungCounty, Keelung, Taipei, Taichung, Tainan and Taoyuan).
 */
import { existsSync } from 'node:fs';
import { TdxClient } from 'tdx-taiwan';

if (existsSync('.env')) process.loadEnvFile('.env');

const { TDX_CLIENT_ID, TDX_CLIENT_SECRET } = process.env;
if (!TDX_CLIENT_ID || !TDX_CLIENT_SECRET) {
  console.error('Set TDX_CLIENT_ID and TDX_CLIENT_SECRET (see .env.example).');
  process.exit(1);
}

const scope = process.argv[2] ?? 'freeway';

const tdx = new TdxClient({ clientId: TDX_CLIENT_ID, clientSecret: TDX_CLIENT_SECRET });

// The freeway and highway sub-APIs take no city; the city methods do. Adapt once here.
const feeds =
  scope === 'freeway' || scope === 'highway'
    ? tdx.traffic[scope]
    : {
        sections: () => tdx.traffic.sections(scope),
        liveTraffic: () => tdx.traffic.liveTraffic(scope),
        congestionLevels: () => tdx.traffic.congestionLevels(scope),
        liveEvents: () => tdx.traffic.liveEvents(scope),
      };

const [{ Sections: sections }, { LiveTraffics: live }, { CongestionLevels: scales }, events] =
  await Promise.all([
    feeds.sections(),
    feeds.liveTraffic(),
    feeds.congestionLevels(),
    feeds.liveEvents().catch(() => undefined), // not every city has an event feed
  ]);

const sectionById = new Map(sections.map((s) => [s.SectionID, s]));
// Level names live in the congestion scales, keyed by scale ID and level number.
const levelName = new Map<string, string>(
  scales.flatMap((scale) =>
    scale.Levels.map((l) => [`${scale.CongestionLevelID}:${l.Level}`, l.LevelName]),
  ),
);

const worst = live
  .filter((t) => Number(t.CongestionLevel) > 0) // drop unknown (0), closed (-1) and bad (-99)
  .sort(
    (a, b) =>
      Number(b.CongestionLevel) - Number(a.CongestionLevel) || a.TravelSpeed - b.TravelSpeed,
  )
  .slice(0, 15);

console.log(
  `${scope}: ${live.length} sections with live data, the ${worst.length} most congested:\n`,
);
console.table(
  worst.map((t) => {
    const section = t.SectionID ? sectionById.get(t.SectionID) : undefined;
    return {
      road: section?.RoadName ?? '?',
      section: (section?.SectionName ?? t.SectionID ?? '').slice(0, 36),
      direction: section?.RoadDirection ?? '',
      speed_kmh: t.TravelSpeed,
      travel_s: t.TravelTime,
      level:
        `${t.CongestionLevel} ${levelName.get(`${t.CongestionLevelID}:${t.CongestionLevel}`) ?? ''}`.trim(),
    };
  }),
);

if (events) {
  console.log(`\n${events.LiveEvents.length} live events; the latest 10:\n`);
  const latest = [...events.LiveEvents]
    .sort((a, b) => (b.LastUpdateTime ?? '').localeCompare(a.LastUpdateTime ?? ''))
    .slice(0, 10);
  for (const e of latest) {
    const road = e.Location.FreeExpressHighway;
    const where = road
      ? `${road.Road} ${road.Direction ?? ''} ${road.StartKM}${road.Interchange ? ` (${road.Interchange})` : ''}`
      : (e.Location.Other ?? e.Location.CityRoad?.Roadways.map((r) => r.Road).join(', ') ?? '');
    console.log(`- ${e.EventTitle}: ${where.trim()} — ${e.Description.slice(0, 60)}`);
  }
}
