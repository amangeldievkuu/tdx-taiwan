/**
 * Prints the buses due at the bus station nearest to a point, every route in one call.
 *
 *   cp .env.example .env   # add your TDX keys
 *   npx tsx examples/bus-arrivals.ts [lat] [lon] [city]
 *
 * Defaults to Taipei Main Station (25.0478, 121.5170) in Taipei.
 */
import { existsSync } from 'node:fs';
import { TdxClient, type BusCity } from 'tdx-taiwan';

if (existsSync('.env')) process.loadEnvFile('.env');

const { TDX_CLIENT_ID, TDX_CLIENT_SECRET } = process.env;
if (!TDX_CLIENT_ID || !TDX_CLIENT_SECRET) {
  console.error('Set TDX_CLIENT_ID and TDX_CLIENT_SECRET (see .env.example).');
  process.exit(1);
}

const [lat = 25.0478, lon = 121.517] = process.argv.slice(2, 4).map(Number);
const city: BusCity = process.argv[4] ?? 'Taipei';

/** Great-circle distance in metres. */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(a));
}

const tdx = new TdxClient({ clientId: TDX_CLIENT_ID, clientSecret: TDX_CLIENT_SECRET });

// The stations within 300 m, each with the stop of every route that serves it.
const stations = await tdx.bus.stations(city, { nearby: { lat, lon, meters: 300 } });
const station = stations
  .map((s) => {
    const pos = s.StationPosition;
    const distance =
      pos.PositionLat == null || pos.PositionLon == null
        ? Infinity
        : haversine(lat, lon, pos.PositionLat, pos.PositionLon);
    return { s, distance };
  })
  .sort((a, b) => a.distance - b.distance)[0];

const stopUIDs = [...new Set(station?.s.Stops?.map((stop) => stop.StopUID) ?? [])];
if (!station || stopUIDs.length === 0) {
  console.log(`No bus station within 300 m of (${lat}, ${lon}) in ${city}.`);
  process.exit(0);
}

// One call for every route at those stops: eta without a route name, filtered on StopUID.
const etas = await tdx.bus.eta(city, {
  filter: stopUIDs.map((uid) => `StopUID eq '${uid}'`).join(' or '),
});

const status = ['', 'not departed', 'not stopping', 'last bus passed', 'not running today'];
const rows = etas
  .map((e) => ({
    route: e.RouteName?.Zh_tw ?? '?',
    towards: e.Direction === 0 ? 'outbound' : e.Direction === 1 ? 'inbound' : 'loop',
    minutes: e.EstimateTime == null ? null : Math.round(e.EstimateTime / 60),
    note: (e.StopStatus && status[e.StopStatus]) || (e.IsLastBus ? 'last bus' : ''),
  }))
  .sort((a, b) => (a.minutes ?? Infinity) - (b.minutes ?? Infinity));

console.log(
  `Buses due at ${station.s.StationName.Zh_tw} (${Math.round(station.distance)} m away) in ${city}:\n`,
);
console.table(rows.map((r) => ({ ...r, minutes: r.minutes ?? '—' })));
