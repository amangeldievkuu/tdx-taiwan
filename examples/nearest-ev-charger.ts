/**
 * Prints the 5 nearest EV charging stations with a free connector of the chosen type.
 *
 *   cp .env.example .env   # add your TDX keys
 *   npx tsx examples/nearest-ev-charger.ts [lat] [lon] [city] [connectorType]
 *
 * Defaults to Taipei Main Station (25.0478, 121.5170) in Taipei and CCS2 (connector type 2).
 * Connector types: 1 CCS1, 2 CCS2, 3 CHAdeMO, 4 Tesla TPC, 5 J1772 (Type 1), 6 Mennekes (Type 2).
 */
import { existsSync } from 'node:fs';
import { TdxClient, type EvCity } from 'tdx-taiwan';

if (existsSync('.env')) process.loadEnvFile('.env');

const { TDX_CLIENT_ID, TDX_CLIENT_SECRET } = process.env;
if (!TDX_CLIENT_ID || !TDX_CLIENT_SECRET) {
  console.error('Set TDX_CLIENT_ID and TDX_CLIENT_SECRET (see .env.example).');
  process.exit(1);
}

const [lat = 25.0478, lon = 121.517] = process.argv.slice(2, 4).map(Number);
const city: EvCity = process.argv[4] ?? 'Taipei';
const connectorType = Number(process.argv[5] ?? 2);

/** Great-circle distance in metres. */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(a));
}

const tdx = new TdxClient({ clientId: TDX_CLIENT_ID, clientSecret: TDX_CLIENT_SECRET });

const [{ Stations: stations }, { LiveStatuses: live }, { Connectors: connectors }] =
  await Promise.all([
    tdx.ev.stations(city),
    // Free connectors (status 1) of the chosen type.
    tdx.ev.liveStatus(city, {
      filter: `ConnectorStatus eq 1 and ConnectorType eq ${connectorType}`,
    }),
    tdx.ev.connectors(city, { filter: `Type eq ${connectorType}` }),
  ]);

// Status → connector on ConnectorID → station via the connector's StationID (a status's own
// StationID can use another ID scheme). Fall back to it when the connector list is incomplete.
const connectorById = new Map(connectors.map((c) => [c.ConnectorID, c]));
const freeByStation = new Map<string, string[]>();
for (const status of live) {
  const connector = connectorById.get(status.ConnectorID);
  const stationId = connector?.StationID ?? status.StationID;
  const list = freeByStation.get(stationId) ?? [];
  list.push(connector?.PowerRating ?? '?');
  freeByStation.set(stationId, list);
}

const nearest = stations
  .filter((s) => freeByStation.has(s.StationID))
  .map((s) => ({ station: s, distance: haversine(lat, lon, s.PositionLat, s.PositionLon) }))
  .sort((a, b) => a.distance - b.distance)
  .slice(0, 5);

console.log(
  `Nearest stations with a free type-${connectorType} connector near (${lat}, ${lon}) in ${city}:\n`,
);
console.table(
  nearest.map(({ station, distance }) => ({
    station: station.StationName.Zh_tw,
    distance: `${Math.round(distance)} m`,
    free: freeByStation.get(station.StationID)?.length,
    power: [...new Set(freeByStation.get(station.StationID))].join(', '),
    charging_rate: station.ChargingRate.slice(0, 30),
  })),
);
