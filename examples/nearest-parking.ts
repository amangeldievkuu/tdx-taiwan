/**
 * Prints the 5 nearest car parks with free car spaces right now.
 *
 *   cp .env.example .env   # add your TDX keys
 *   npx tsx examples/nearest-parking.ts [lat] [lon] [city]
 *
 * Defaults to Taipei Main Station (25.0478, 121.5170) in Taipei. Only car parks that appear in
 * both the car park list and the live availability list can be ranked; TDX does not publish
 * availability for every car park, nor a car park record for every availability record.
 */
import { existsSync } from 'node:fs';
import { TdxClient, type ParkingCity } from 'tdx-taiwan';

if (existsSync('.env')) process.loadEnvFile('.env');

const { TDX_CLIENT_ID, TDX_CLIENT_SECRET } = process.env;
if (!TDX_CLIENT_ID || !TDX_CLIENT_SECRET) {
  console.error('Set TDX_CLIENT_ID and TDX_CLIENT_SECRET (see .env.example).');
  process.exit(1);
}

const [lat = 25.0478, lon = 121.517] = process.argv.slice(2, 4).map(Number);
const city: ParkingCity = process.argv[4] ?? 'Taipei';

/** Great-circle distance in metres. */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(a));
}

const tdx = new TdxClient({ clientId: TDX_CLIENT_ID, clientSecret: TDX_CLIENT_SECRET });

const [{ CarParks: carParks }, { ParkingAvailabilities: availability }] = await Promise.all([
  tdx.parking.carParks(city),
  // Open car parks only (ServiceStatus 1).
  tdx.parking.availability(city, { filter: 'ServiceStatus eq 1' }),
]);

const carParkById = new Map(carParks.map((c) => [c.CarParkID, c]));

const nearest = availability
  .flatMap((live) => {
    const carPark = carParkById.get(live.CarParkID);
    const pos = carPark?.CarParkPosition;
    // Car spaces (SpaceType 1) if reported separately, otherwise the total.
    const free =
      live.Availabilities?.find((a) => a.SpaceType === 1)?.AvailableSpaces ?? live.AvailableSpaces;
    if (!carPark || free <= 0 || pos?.PositionLat == null || pos.PositionLon == null) return [];
    return [{ carPark, free, distance: haversine(lat, lon, pos.PositionLat, pos.PositionLon) }];
  })
  .sort((a, b) => a.distance - b.distance)
  .slice(0, 5);

console.log(`Nearest car parks with free car spaces near (${lat}, ${lon}) in ${city}:\n`);
console.table(
  nearest.map(({ carPark, free, distance }) => ({
    car_park: carPark.CarParkName.Zh_tw,
    distance: `${Math.round(distance)} m`,
    free_car_spaces: free,
    fare: carPark.FareDescription.replace(/\s+/g, ' ').slice(0, 40),
  })),
);
