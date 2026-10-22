/**
 * Prints the Alishan Forest Railway's regular trains with their first and last stops, and the
 * adult fares from 嘉義 to 阿里山.
 *
 *   cp .env.example .env   # add your TDX keys
 *   npx tsx examples/alishan-timetable.ts [from] [to]
 *
 * Station IDs: 360 嘉義, 361 北門, 372 十字路, 378 阿里山, 381 祝山.
 */
import { existsSync } from 'node:fs';
import { TdxClient } from 'tdx-taiwan';

if (existsSync('.env')) process.loadEnvFile('.env');

const { TDX_CLIENT_ID, TDX_CLIENT_SECRET } = process.env;
if (!TDX_CLIENT_ID || !TDX_CLIENT_SECRET) {
  console.error('Set TDX_CLIENT_ID and TDX_CLIENT_SECRET (see .env.example).');
  process.exit(1);
}

const [from = '360', to = '378'] = process.argv.slice(2, 4);

const tdx = new TdxClient({ clientId: TDX_CLIENT_ID, clientSecret: TDX_CLIENT_SECRET });

const [timetable, fares, types] = await Promise.all([
  tdx.afr.generalTimetable(),
  tdx.afr.odFare(from, to),
  tdx.afr.trainTypes(),
]);

console.log(`${timetable.TimetableName ?? 'Regular timetable'} (v${timetable.SrcVersion})`);
console.table(
  timetable.TrainTimetables.map((t) => {
    const first = t.StopTimes[0];
    const last = t.StopTimes.at(-1);
    return {
      train: t.TrainInfo.TrainNo,
      from: `${first?.StationName.Zh_tw} ${first?.DepartureTime}`,
      to: `${last?.StationName.Zh_tw} ${last?.ArrivalTime}`,
      headsign: t.TrainInfo.TripHeadSign,
      days: t.ServiceDay.ServiceTag ?? '',
    };
  }),
);

const typeName = (code: number) =>
  types.TrainTypes.find((t) => t.TrainTypeCode === String(code))?.TrainTypeName.Zh_tw ?? code;
const origin = fares.ODFares[0]?.OriginStationName.Zh_tw ?? from;
const destination = fares.ODFares[0]?.DestinationStationName.Zh_tw ?? to;
console.log(`\nAdult fares ${origin} → ${destination}:`);
for (const od of fares.ODFares) {
  const adult = od.Fares.find((f) => f.TicketType === 1 && f.FareClass === 1);
  console.log(`  ${typeName(od.TrainType)}: NT$${adult?.Price ?? '-'}`);
}
