/**
 * Prints today's ferry departures from a port: the live board when the port has one, otherwise
 * the daily timetable of the routes that call there.
 *
 *   cp .env.example .env   # add your TDX keys
 *   npx tsx examples/ferry-departures.ts [portId]
 *
 * Defaults to 小琉球白沙港 (TW001). Other ports with live boards: TWDNK 東港, TW007 南竿福澳港,
 * TW008 北竿白沙港, TWSHT 金門水頭, TWTTT 台東富岡港, TWGNI 綠島南寮港, TWWOT 望安港. City
 * blue-highway routes (Taipei, Kaohsiung, Penghu inter-island) live under `tdx.ship.domestic`.
 */
import { existsSync } from 'node:fs';
import { TdxClient, trainDate } from 'tdx-taiwan';

if (existsSync('.env')) process.loadEnvFile('.env');

const { TDX_CLIENT_ID, TDX_CLIENT_SECRET } = process.env;
if (!TDX_CLIENT_ID || !TDX_CLIENT_SECRET) {
  console.error('Set TDX_CLIENT_ID and TDX_CLIENT_SECRET (see .env.example).');
  process.exit(1);
}

const port = process.argv[2] ?? 'TW001';

const tdx = new TdxClient({ clientId: TDX_CLIENT_ID, clientSecret: TDX_CLIENT_SECRET });

const [{ Ports: ports }, { Routes: routes }, { Vessels: vessels }, { ShipLiveBoardses: boards }] =
  await Promise.all([
    tdx.ship.ports({ select: ['PortID', 'PortName'] }),
    tdx.ship.routes(),
    tdx.ship.vessels({ select: ['VesselID', 'VesselName'] }),
    tdx.ship.liveBoard(),
  ]);
const portName = (id: string | undefined) =>
  ports.find((p) => p.PortID === id)?.PortName.Zh_tw ?? id ?? '?';
const routeName = (id: string | undefined) =>
  routes.find((r) => r.RouteID === id)?.RouteName.Zh_tw ?? id ?? '?';
const vesselName = (id: string | undefined) =>
  vessels.find((v) => v.VesselID === id)?.VesselName.Zh_tw ?? '';
const clock = (value: string | undefined) => value?.slice(11, 16) ?? '-';

const board = boards.find((b) => b.PortID === port);
if (board?.DepartureLiveBoards?.length) {
  const rows = [...(board.DepartureLiveBoards ?? [])].sort((a, b) =>
    (a.ScheduledDepartureTime ?? '').localeCompare(b.ScheduledDepartureTime ?? ''),
  );
  console.log(`${portName(port)} (${port}) live departures, ${board.ShipDate?.slice(0, 10)}:\n`);
  console.table(
    rows.map((d) => ({
      scheduled: clock(d.ScheduledDepartureTime),
      estimated: clock(d.EstimateDepartureTime),
      actual: clock(d.ActualDepartureTime),
      to: portName(d.ArrivalPortID),
      route: routeName(d.RouteID),
      vessel: vesselName(d.VesselID) || (d.VesselName?.Zh_tw ?? ''),
      remark: d.CancelReason || d.DepartureRemark || '',
    })),
  );
} else {
  // No live board (or an empty one): fall back to today's timetable of every route that
  // starts or ends here.
  const today = trainDate();
  const touching = routes.filter((r) => r.StartPortID === port || r.EndPortID === port);
  console.log(
    `${portName(port)} (${port}) has no live departures; timetable for ${today} from ${touching.length} routes:\n`,
  );
  const rows: Array<{ departs: string; route: string; next: string; trip: string }> = [];
  for (const route of touching) {
    const { DailySchedules: days } = await tdx.ship.dailySchedule(route.RouteID);
    for (const day of days) {
      // Nationwide dates are YYYY-MM-DD; the city feeds use YYYY/MM/DD.
      if (day.Date.replace(/\//g, '-') !== today) continue;
      for (const trip of day.TimeTables ?? []) {
        const here = trip.StopTimes.findIndex((s) => s.PortID === port && s.DepartureTime);
        if (here < 0) continue;
        const stop = trip.StopTimes[here];
        rows.push({
          departs: (stop?.DepartureTime ?? '').padStart(5, '0'), // '6:15' → '06:15'
          route: route.RouteName.Zh_tw ?? route.RouteID,
          next: portName(trip.StopTimes[here + 1]?.PortID),
          trip: trip.TripID,
        });
      }
    }
  }
  rows.sort((a, b) => a.departs.localeCompare(b.departs));
  if (rows.length === 0) console.log('No sailings found for today.');
  else console.table(rows);
}
