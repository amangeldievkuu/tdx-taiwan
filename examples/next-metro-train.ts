/**
 * Prints the next trains at a metro station, per direction.
 *
 *   cp .env.example .env   # add your TDX keys
 *   npx tsx examples/next-metro-train.ts [system] [stationId]
 *
 * Defaults to Formosa Boulevard (美麗島, R10) on the Kaohsiung Metro (KRTC).
 * Live boards exist for KRTC, TYMC, KLRT and TRTC; TRTC only lists trains arriving right now.
 */
import { existsSync } from 'node:fs';
import { TdxClient, odata, type MetroLiveBoardSystem, type MetroServiceStatus } from 'tdx-taiwan';

if (existsSync('.env')) process.loadEnvFile('.env');

const { TDX_CLIENT_ID, TDX_CLIENT_SECRET } = process.env;
if (!TDX_CLIENT_ID || !TDX_CLIENT_SECRET) {
  console.error('Set TDX_CLIENT_ID and TDX_CLIENT_SECRET (see .env.example).');
  process.exit(1);
}

const system: MetroLiveBoardSystem = process.argv[2] ?? 'KRTC';
const stationId = process.argv[3] ?? 'R10';

const STATUS: Record<MetroServiceStatus, string> = {
  0: '',
  1: 'not departed yet',
  2: 'not stopping',
  3: 'last train has left',
  4: 'no service today',
};

const tdx = new TdxClient({ clientId: TDX_CLIENT_ID, clientSecret: TDX_CLIENT_SECRET });

const board = await tdx.metro.liveBoard(system, {
  filter: `StationID eq ${odata.str(stationId)}`,
  orderBy: 'EstimateTime',
});

if (board.length === 0) {
  console.log(`No trains listed for ${stationId} on ${system} right now.`);
  if (system === 'TRTC') {
    console.log('The Taipei Metro board only lists trains that are arriving at this moment;');
    console.log('try again in a minute, or try KRTC, TYMC or KLRT, which list every station.');
  }
  process.exit(0);
}

const [first] = board;
console.log(`${first?.StationName.Zh_tw} (${stationId}, ${system}): next trains\n`);
console.table(
  board.map((b) => ({
    line: b.LineName.Zh_tw,
    direction: b.TripHeadSign,
    minutes: b.EstimateTime ?? '-',
    status: STATUS[b.ServiceStatus],
  })),
);
