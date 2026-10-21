/**
 * Prints the day's Taiwan Railway (臺鐵) trains between two stations, with the adult fare.
 *
 *   cp .env.example .env   # add your TDX keys
 *   npx tsx examples/tra-trains.ts [from] [to] [YYYY-MM-DD]
 *
 * Defaults to Taipei (1000) → Kaohsiung (4400), today in Taiwan. Other station IDs: 0900 基隆,
 * 1020 板橋, 1210 新竹, 3300 臺中, 4220 臺南, 7000 花蓮, 7190 宜蘭 (see `tdx.tra.stations()`).
 */
import { existsSync } from 'node:fs';
import { TdxClient, trainDate } from 'tdx-taiwan';

if (existsSync('.env')) process.loadEnvFile('.env');

const { TDX_CLIENT_ID, TDX_CLIENT_SECRET } = process.env;
if (!TDX_CLIENT_ID || !TDX_CLIENT_SECRET) {
  console.error('Set TDX_CLIENT_ID and TDX_CLIENT_SECRET (see .env.example).');
  process.exit(1);
}

const [from = '1000', to = '4400', date = trainDate()] = process.argv.slice(2, 5);

const tdx = new TdxClient({ clientId: TDX_CLIENT_ID, clientSecret: TDX_CLIENT_SECRET });

const [timetable, fares] = await Promise.all([
  tdx.tra.timetable(from, to, date),
  tdx.tra.odFare(from, to),
]);

const trains = [...(timetable.TrainTimetables ?? [])].sort((a, b) =>
  (a.StopTimes[0]?.DepartureTime ?? '').localeCompare(b.StopTimes[0]?.DepartureTime ?? ''),
);

console.log(`${from} → ${to} on ${timetable.TrainDate}: ${trains.length} trains\n`);
console.table(
  trains.map(({ TrainInfo: info, StopTimes: [departure, arrival] }) => {
    // TRA lines form a ring, so fares differ by direction as well as by train type.
    const fare = fares.ODFares.find(
      (f) => String(f.TrainType) === info.TrainTypeCode && f.Direction === info.Direction,
    )?.Fares.find((p) => p.TicketType === 1 && p.FareClass === 1 && p.CabinClass === 1);
    return {
      train: info.TrainNo,
      type: info.TrainTypeName.Zh_tw,
      departs: departure?.DepartureTime,
      arrives: arrival?.ArrivalTime,
      fare: fare ? `NT$${fare.Price}` : '-',
    };
  }),
);
