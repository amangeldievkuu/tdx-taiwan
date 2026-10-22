import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  type RailODDistance,
  type RailODFare,
  type RailOperator,
  type RailS2SDistance,
  TdxApiError,
} from '../../src/index.js';
import { API, clientWithResponse, loadFixture } from '../helpers.js';

const operatorsFixture = loadFixture('rail-operator.json') as RailOperator[];
const odDistanceFixture = loadFixture('rail-od-distance.json') as RailODDistance[];
const odDistanceByNameFixture = loadFixture('rail-od-distance-by-name.json') as RailODDistance[];
const odFareFixture = loadFixture('rail-od-fare.json') as RailODFare;
const s2sFixture = loadFixture('rail-s2s-distance.json') as RailS2SDistance[];

describe('tdx.rail', () => {
  it('requests each endpoint as JSON and encodes station names', async () => {
    const lists = clientWithResponse([]);
    const objects = clientWithResponse({});

    await lists.tdx.rail.operators();
    await lists.tdx.rail.odDistance('TRTC_NTMC');
    await lists.tdx.rail.odDistance('TRTC_NTMC', { top: 2 });
    await lists.tdx.rail.odDistance('TRTC_NTMC', '板橋', '西門');
    await lists.tdx.rail.odDistance('TRA', '臺北', '板橋', { top: 1 });
    await lists.tdx.rail.s2sDistance('THSR');
    await objects.tdx.rail.odFare('TRTC_NTMC', '板橋', '西門');
    await objects.tdx.rail.odFare('TRA', '臺北', '板橋', { top: 3 });

    const banqiao = encodeURIComponent('板橋');
    const ximen = encodeURIComponent('西門');
    const taipei = encodeURIComponent('臺北');
    expect(lists.apiUrls).toEqual([
      `${API}/v2/Rail/Operator?$format=JSON`,
      `${API}/v2/Rail/ODDistance/TRTC_NTMC?$format=JSON`,
      `${API}/v2/Rail/ODDistance/TRTC_NTMC?$top=2&$format=JSON`,
      `${API}/v2/Rail/ODDistance/TRTC_NTMC/${banqiao}/to/${ximen}?$format=JSON`,
      `${API}/v2/Rail/ODDistance/TRA/${taipei}/to/${banqiao}?$top=1&$format=JSON`,
      `${API}/v2/Rail/S2SDistance/THSR?$format=JSON`,
    ]);
    expect(objects.apiUrls).toEqual([
      `${API}/v2/Rail/ODFare/TRTC_NTMC/${banqiao}/to/${ximen}?$format=JSON`,
      `${API}/v2/Rail/ODFare/TRA/${taipei}/to/${banqiao}?$top=3&$format=JSON`,
    ]);
    expect(() => lists.tdx.rail.odDistance('')).toThrow(TypeError);
    expect(() => lists.tdx.rail.odDistance('TRA', '臺北', '')).toThrow(TypeError);
    expect(() => objects.tdx.rail.odFare('TRA', ' ', '板橋')).toThrow(TypeError);
    await expect(lists.tdx.rail.odFare('TRA', '臺北', '板橋')).rejects.toBeInstanceOf(TdxApiError);
    await expect(objects.tdx.rail.operators()).rejects.toBeInstanceOf(TdxApiError);
  });

  it('parses operators and distances', async () => {
    const operators = await clientWithResponse(operatorsFixture).tdx.rail.operators();
    const distances = await clientWithResponse(odDistanceFixture).tdx.rail.odDistance('TRTC_NTMC');
    const pair = await clientWithResponse(odDistanceByNameFixture).tdx.rail.odDistance(
      'TRTC_NTMC',
      '板橋',
      '西門',
    );
    const s2s = await clientWithResponse(s2sFixture).tdx.rail.s2sDistance('THSR');
    expectTypeOf(operators).toEqualTypeOf<RailOperator[]>();
    expectTypeOf(distances).toEqualTypeOf<RailODDistance[]>();
    expectTypeOf(pair).toEqualTypeOf<RailODDistance[]>();
    expectTypeOf(s2s).toEqualTypeOf<RailS2SDistance[]>();

    expect(operators.map((o) => [o.OperatorID, o.OperatorNo, o.ProviderID])).toEqual([
      ['KRTC', '5103', '028'],
      ['NTMC', '5104', '049'],
      ['NTMC', '5104', '050'],
    ]);
    expect(distances.map((d) => [d.Origin.StationID, d.Destination.StationID, d.Distance])).toEqual(
      [
        ['BL01', 'BL02', 1.95],
        ['BL01', 'BL03', 3.06],
      ],
    );
    expect(pair).toEqual([
      {
        Origin: { StationID: 'BL07_Y16', StationName: '板橋' },
        Destination: { StationID: 'BL11_G12', StationName: '西門' },
        Distance: 6.54,
      },
    ]);
    expect(s2s[0]?.LineID).toBe('HSRL');
    expect(s2s[0]?.LineName).toEqual({ Zh_tw: '台灣高鐵線' });
    expect(
      s2s[0]?.Stations?.map((s) => [s.Sequence, s.From.StationID, s.To.StationID, s.Distance]),
    ).toEqual([
      [1, '990', '1000', 9.2],
      [2, '1000', '1010', 7.22],
      [3, '1010', '1020', 29.16],
    ]);
  });

  it('parses a by-name fare lookup with its Chinese labels', async () => {
    const fare = await clientWithResponse(odFareFixture).tdx.rail.odFare(
      'TRTC_NTMC',
      '板橋',
      '西門',
    );
    expectTypeOf(fare).toEqualTypeOf<RailODFare>();

    expect(fare.Origin).toEqual({ StationID: 'BL07', StationName: '板橋' });
    expect(fare.ODFares?.map((f) => [f.TicketType, f.FareClass, f.Price])).toEqual([
      ['一般票(單程票)', '成人', 25],
      ['一般票(單程票)', '孩童', 10],
      ['一般票(單程票)', '敬老', 10],
      ['一般票(單程票)', '愛心', 10],
      ['一般票(單程票)', '愛心優待/愛心陪伴', 10],
    ]);
    expect(fare.ODFares?.[0]?.TrainType).toBe('');
  });
});
