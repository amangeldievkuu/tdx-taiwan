/**
 * Prints an airport's live departure or arrival board: the next 20 of today's flights.
 *
 *   cp .env.example .env   # add your TDX keys
 *   npx tsx examples/flight-board.ts [airport] [departures|arrivals]
 *
 * Defaults to Taipei Songshan (TSA) departures. Airports: TPE 桃園, TSA 松山, KHH 高雄,
 * RMQ 臺中, TNN 臺南, CYI 嘉義, HUN 花蓮, TTT 臺東, MZG 澎湖, KNH 金門, MFK 北竿, LZN 南竿...
 */
import { existsSync } from 'node:fs';
import {
  TdxClient,
  trainDate,
  type AirAirportId,
  type AirArrival,
  type AirDeparture,
} from 'tdx-taiwan';

if (existsSync('.env')) process.loadEnvFile('.env');

const { TDX_CLIENT_ID, TDX_CLIENT_SECRET } = process.env;
if (!TDX_CLIENT_ID || !TDX_CLIENT_SECRET) {
  console.error('Set TDX_CLIENT_ID and TDX_CLIENT_SECRET (see .env.example).');
  process.exit(1);
}

const airport: AirAirportId = process.argv[2] ?? 'TSA';
const arrivals = process.argv[3] === 'arrivals';

const tdx = new TdxClient({ clientId: TDX_CLIENT_ID, clientSecret: TDX_CLIENT_SECRET });

/** The columns shared by departure and arrival rows. */
interface Row {
  flight: AirDeparture | AirArrival;
  /** The other end of the flight: destination for departures, origin for arrivals. */
  other: string;
  scheduled: string;
  estimated?: string;
  actual?: string;
  remark?: string;
}

const departureRows = (board: AirDeparture[]): Row[] =>
  board.map((f) => ({
    flight: f,
    other: f.ArrivalAirportID,
    scheduled: f.ScheduleDepartureTime ?? '',
    estimated: f.EstimatedDepartureTime,
    actual: f.ActualDepartureTime,
    remark: f.DepartureRemark,
  }));
const arrivalRows = (board: AirArrival[]): Row[] =>
  board.map((f) => ({
    flight: f,
    other: f.DepartureAirportID,
    scheduled: f.ScheduleArrivalTime ?? '',
    estimated: f.EstimatedArrivalTime,
    actual: f.ActualArrivalTime,
    remark: f.ArrivalRemark,
  }));

// Airport names for the other end of each flight; the board only carries IATA codes.
const passengerOnly = { filter: 'IsCargo eq false' };
const [airports, all] = await Promise.all([
  tdx.air.airports({ select: ['AirportID', 'AirportName'] }),
  arrivals
    ? tdx.air.arrivals(airport, passengerOnly).then(arrivalRows)
    : tdx.air.departures(airport, passengerOnly).then(departureRows),
]);
const nameOf = new Map(airports.map((a) => [a.AirportID, a.AirportName.En ?? a.AirportID]));

// FIDS times are Taiwan local time without an offset (`2026-10-21T08:50`); so is this clock.
const today = trainDate();
const now = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Taipei' }).replace(' ', 'T');
const time = (value: string | undefined) => value?.slice(11) ?? '-';

const next = all
  .filter((r) => r.flight.FlightDate === today && (r.actual ?? r.scheduled) >= now)
  .sort((a, b) => a.scheduled.localeCompare(b.scheduled))
  .slice(0, 20);

const title = `${arrivals ? 'Arrivals at' : 'Departures from'} ${airport} on ${today}`;
console.log(`${title} (${next.length} of ${all.length} flights, from ${time(now)} on):\n`);
console.table(
  next.map((r) => ({
    flight: r.flight.AirlineID + r.flight.FlightNumber,
    [arrivals ? 'from' : 'to']: `${r.other} ${nameOf.get(r.other) ?? ''}`.trim(),
    scheduled: time(r.scheduled),
    estimated: time(r.estimated),
    actual: time(r.actual),
    terminal: r.flight.Terminal || '-',
    gate: r.flight.Gate?.trim() || '-',
    remark: r.remark ?? '',
  })),
);
