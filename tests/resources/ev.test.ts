import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  type EvChargingPoints,
  type EvChargingRates,
  type EvConnectors,
  type EvLiveStatus,
  type EvLiveStatuses,
  type EvStations,
  TdxApiError,
  query,
} from '../../src/index.js';
import { API, clientWithResponse, loadFixture } from '../helpers.js';

const stationsFixture = loadFixture('ev-station-taipei.json') as EvStations;
const pointsFixture = loadFixture('ev-charging-point-taipei.json') as EvChargingPoints;
const connectorsFixture = loadFixture('ev-connector-taipei.json') as EvConnectors;
const liveFixture = loadFixture('ev-live-status-taipei.json') as EvLiveStatuses;
const ratesFixture = loadFixture('ev-charging-rate-taipei.json') as EvChargingRates;
const freewayFixture = loadFixture('ev-station-freeway.json') as EvStations;

describe('tdx.ev paths', () => {
  it('requests each city endpoint as JSON', async () => {
    const { tdx, apiUrls } = clientWithResponse({});

    await tdx.ev.stations('Taipei');
    await tdx.ev.chargingPoints('Taipei');
    await tdx.ev.connectors('Taipei');
    await tdx.ev.liveStatus('Taipei');
    await tdx.ev.chargingRates('Taipei');

    expect(apiUrls).toEqual(
      ['Station', 'ChargingPoint', 'Connector', 'ConnectorLiveStatus', 'ChargingRate'].map(
        (kind) => `${API}/v1/EV/${kind}/City/Taipei?$format=JSON`,
      ),
    );
  });

  it('requests each freeway service area endpoint as JSON', async () => {
    const { tdx, apiUrls } = clientWithResponse({});

    await tdx.ev.freeway.stations();
    await tdx.ev.freeway.chargingPoints();
    await tdx.ev.freeway.connectors();
    await tdx.ev.freeway.liveStatus();
    await tdx.ev.freeway.chargingRates();

    expect(apiUrls).toEqual(
      ['Station', 'ChargingPoint', 'Connector', 'ConnectorLiveStatus', 'ChargingRate'].map(
        (kind) => `${API}/v1/EV/${kind}/Freeway/ServiceArea?$format=JSON`,
      ),
    );
  });

  it('applies queries to the items inside the wrapper', async () => {
    const { tdx, apiUrls } = clientWithResponse({});

    await tdx.ev.liveStatus(
      'Kaohsiung',
      query<EvLiveStatus>().filter('ConnectorStatus eq 1').filter('ConnectorType eq 2'),
    );

    expect(decodeURIComponent(apiUrls[0] ?? '')).toBe(
      `${API}/v1/EV/ConnectorLiveStatus/City/Kaohsiung` +
        `?$filter=(ConnectorStatus eq 1) and (ConnectorType eq 2)&$format=JSON`,
    );
  });

  it('validates the city', () => {
    const { tdx } = clientWithResponse({});

    expect(() => tdx.ev.stations('')).toThrow(TypeError);
  });

  it('rejects an array where a wrapper object is expected', async () => {
    const { tdx } = clientWithResponse([]);

    await expect(tdx.ev.freeway.stations()).rejects.toBeInstanceOf(TdxApiError);
  });
});

describe('tdx.ev parsing', () => {
  it('parses stations, including the StationID the spec omits', async () => {
    const { tdx } = clientWithResponse(stationsFixture);

    const result = await tdx.ev.stations('Taipei');
    expectTypeOf(result).toEqualTypeOf<EvStations>();

    expect(result.Stations.map((s) => [s.StationID, s.StationName.Zh_tw])).toEqual([
      ['33029464-STP6360001', '中山國中站'],
      ['TPE0201U01', '國立臺灣大學校總區平面停車場'],
    ]);
    expect(result.Stations[0]?.Connectors).toEqual([{ Type: 5, Power: 1, Quantity: 6 }]);
    expect(result.Stations[0]?.Location.Address?.Town).toBe('松山區');
  });

  it('parses charging points with payment and start methods', async () => {
    const { tdx } = clientWithResponse(pointsFixture);

    const result = await tdx.ev.chargingPoints('Taipei');
    expectTypeOf(result).toEqualTypeOf<EvChargingPoints>();

    expect(result.ChargingPoints.map((p) => [p.ChargingPointID, p.Payment.CreditCard])).toEqual([
      ['33029464-PTP6360001', true],
      ['42861108-P318611A', true],
    ]);
  });

  it('joins live status → connector (ConnectorID) → station (the connector’s StationID)', async () => {
    const stations = await clientWithResponse(stationsFixture).tdx.ev.stations('Taipei');
    const connectors = await clientWithResponse(connectorsFixture).tdx.ev.connectors('Taipei');
    const live = await clientWithResponse(liveFixture).tdx.ev.liveStatus('Taipei');
    const rates = await clientWithResponse(ratesFixture).tdx.ev.chargingRates('Taipei');
    expectTypeOf(connectors).toEqualTypeOf<EvConnectors>();
    expectTypeOf(live).toEqualTypeOf<EvLiveStatuses>();
    expectTypeOf(rates).toEqualTypeOf<EvChargingRates>();

    const stationName = new Map(stations.Stations.map((s) => [s.StationID, s.StationName.Zh_tw]));
    const connector = new Map(connectors.Connectors.map((c) => [c.ConnectorID, c]));
    const rate = new Map(rates.ChargingRates.map((r) => [r.ConnectorID, r.Rates[0]]));

    // The status's own StationID can use another ID scheme (TPE1578 here), so go via the connector.
    expect(live.LiveStatuses.map((l) => l.StationID)).toEqual(['TPE0201U01', 'TPE1578']);
    expect(
      live.LiveStatuses.map((l) => [
        stationName.get(connector.get(l.ConnectorID)?.StationID ?? ''),
        connector.get(l.ConnectorID)?.PowerRating,
        l.ConnectorStatus,
        rate.get(l.ConnectorID)?.RateType,
      ]),
    ).toEqual([
      ['國立臺灣大學校總區平面停車場', '250kW', 1, 2],
      ['中山國中站', '7KW', 2, 3],
    ]);
  });

  it('parses freeway service area stations', async () => {
    const { tdx } = clientWithResponse(freewayFixture);

    const result = await tdx.ev.freeway.stations();

    expect(result.Stations[0]?.Location.Freeway).toEqual({
      Road: '國道1號',
      ServiceArea: '湖口服務區南站',
    });
  });
});
