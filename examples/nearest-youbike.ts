/**
 * Prints the 5 nearest YouBike stations that have bikes available right now.
 *
 *   cp .env.example .env   # add your TDX keys
 *   npx tsx examples/nearest-youbike.ts [lat] [lon] [city]
 *
 * Defaults to Taipei Main Station (25.0478, 121.5170) in Taipei.
 */
import { existsSync } from 'node:fs';
import { TdxClient, type BikeCity } from 'tdx-taiwan';

if (existsSync('.env')) process.loadEnvFile('.env');

const { TDX_CLIENT_ID, TDX_CLIENT_SECRET } = process.env;
if (!TDX_CLIENT_ID || !TDX_CLIENT_SECRET) {
  console.error('Set TDX_CLIENT_ID and TDX_CLIENT_SECRET (see .env.example).');
  process.exit(1);
}

const [lat = 25.0478, lon = 121.517] = process.argv.slice(2, 4).map(Number);
const city: BikeCity = process.argv[4] ?? 'Taipei';

/** Great-circle distance in metres. */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(a));
}

const tdx = new TdxClient({ clientId: TDX_CLIENT_ID, clientSecret: TDX_CLIENT_SECRET });

const [stations, availability] = await Promise.all([
  tdx.bike.stations(city),
  // Only stations that are operating and have at least one bike.
  tdx.bike.availability(city, { filter: ['ServiceStatus eq 1', 'AvailableRentBikes gt 0'] }),
]);

const bikesByStation = new Map(availability.map((a) => [a.StationUID, a]));

const nearest = stations
  .flatMap((station) => {
    const live = bikesByStation.get(station.StationUID);
    const pos = station.StationPosition;
    if (!live || pos?.PositionLat == null || pos.PositionLon == null) return [];
    const distance = haversine(lat, lon, pos.PositionLat, pos.PositionLon);
    return [{ station, live, distance }];
  })
  .sort((a, b) => a.distance - b.distance)
  .slice(0, 5);

console.log(`Nearest YouBike stations with bikes near (${lat}, ${lon}) in ${city}:\n`);
console.table(
  nearest.map(({ station, live, distance }) => ({
    station: station.StationName?.Zh_tw.replace(/^YouBike2\.0_/, ''),
    distance: `${Math.round(distance)} m`,
    bikes: live.AvailableRentBikes,
    'e-bikes': live.AvailableRentBikesDetail?.ElectricBikes ?? '-',
    'empty docks': live.AvailableReturnBikes,
  })),
);
