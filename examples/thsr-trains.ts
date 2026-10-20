/**
 * Prints the day's high speed rail trains between two stations, with the standard adult fare.
 *
 *   cp .env.example .env   # add your TDX keys
 *   npx tsx examples/thsr-trains.ts [from] [to] [YYYY-MM-DD]
 *
 * Defaults to Taipei (1000) → Zuoying (1070), today in Taiwan. Station IDs: 0990 南港,
 * 1000 台北, 1010 板橋, 1020 桃園, 1030 新竹, 1035 苗栗, 1040 台中, 1043 彰化, 1047 雲林,
 * 1050 嘉義, 1060 台南, 1070 左營.
 */
import { existsSync } from 'node:fs';
import { TdxClient, trainDate } from 'tdx-taiwan';

if (existsSync('.env')) process.loadEnvFile('.env');

const { TDX_CLIENT_ID, TDX_CLIENT_SECRET } = process.env;
if (!TDX_CLIENT_ID || !TDX_CLIENT_SECRET) {
  console.error('Set TDX_CLIENT_ID and TDX_CLIENT_SECRET (see .env.example).');
  process.exit(1);
}

const [from = '1000', to = '1070', date = trainDate()] = process.argv.slice(2, 5);

const tdx = new TdxClient({ clientId: TDX_CLIENT_ID, clientSecret: TDX_CLIENT_SECRET });

const [trains, [od]] = await Promise.all([
  tdx.thsr.timetable(from, to, date, { orderBy: 'OriginStopTime/DepartureTime' }),
  tdx.thsr.odFare(from, to),
]);

const price = (cabin: 1 | 2 | 3) =>
  od?.Fares.find((f) => f.TicketType === 1 && f.FareClass === 1 && f.CabinClass === cabin)?.Price ??
  '-';

const origin = trains[0]?.OriginStopTime.StationName.Zh_tw ?? from;
const destination = trains[0]?.DestinationStopTime.StationName.Zh_tw ?? to;
console.log(`${origin} → ${destination} on ${date}: ${trains.length} trains`);
console.log(
  `Adult fare: standard NT$${price(1)}, business NT$${price(2)}, non-reserved NT$${price(3)}\n`,
);
console.table(
  trains.map((t) => ({
    train: t.DailyTrainInfo.TrainNo,
    departs: t.OriginStopTime.DepartureTime,
    arrives: t.DestinationStopTime.ArrivalTime,
  })),
);
