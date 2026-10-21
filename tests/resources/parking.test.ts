import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  type ParkingAvailabilities,
  type ParkingAvailability,
  type ParkingCarParks,
  type ParkingSegmentAvailabilities,
  type ParkingSegments,
  TdxApiError,
  query,
} from '../../src/index.js';
import { API, clientWithResponse, loadFixture } from '../helpers.js';

const carParksFixture = loadFixture('parking-car-park-taipei.json') as ParkingCarParks;
const availabilityFixture = loadFixture(
  'parking-availability-taipei.json',
) as ParkingAvailabilities;
const segmentsFixture = loadFixture('parking-segment-taipei.json') as ParkingSegments;
const segmentAvailabilityFixture = loadFixture(
  'parking-segment-availability-taipei.json',
) as ParkingSegmentAvailabilities;

describe('tdx.parking paths', () => {
  it('requests each city endpoint as JSON', async () => {
    const { tdx, apiUrls } = clientWithResponse({});

    await tdx.parking.carParks('Taipei');
    await tdx.parking.availability('Kaohsiung');
    await tdx.parking.segments('NewTaipei');
    await tdx.parking.segmentAvailability('Taichung');

    expect(apiUrls).toEqual([
      `${API}/v1/Parking/OffStreet/CarPark/City/Taipei?$format=JSON`,
      `${API}/v1/Parking/OffStreet/ParkingAvailability/City/Kaohsiung?$format=JSON`,
      `${API}/v1/Parking/OnStreet/ParkingSegment/City/NewTaipei?$format=JSON`,
      `${API}/v1/Parking/OnStreet/ParkingSegmentAvailability/City/Taichung?$format=JSON`,
    ]);
  });

  it('applies queries to the items inside the wrapper', async () => {
    const { tdx, apiUrls } = clientWithResponse({});

    await tdx.parking.availability(
      'Taipei',
      query<ParkingAvailability>()
        .filter('AvailableSpaces gt 0')
        .select('CarParkID', 'AvailableSpaces')
        .orderBy('AvailableSpaces', 'desc')
        .top(10),
    );

    expect(decodeURIComponent(apiUrls[0] ?? '')).toBe(
      `${API}/v1/Parking/OffStreet/ParkingAvailability/City/Taipei` +
        `?$select=CarParkID,AvailableSpaces&$filter=AvailableSpaces gt 0` +
        `&$orderby=AvailableSpaces desc&$top=10&$format=JSON`,
    );
  });

  it('validates the city', () => {
    const { tdx } = clientWithResponse({});

    expect(() => tdx.parking.carParks('')).toThrow(TypeError);
    expect(() => tdx.parking.segmentAvailability(' ')).toThrow(TypeError);
  });

  it('rejects an array where a wrapper object is expected', async () => {
    const { tdx } = clientWithResponse([]);

    await expect(tdx.parking.carParks('Taipei')).rejects.toBeInstanceOf(TdxApiError);
  });
});

describe('tdx.parking parsing', () => {
  it('parses car parks, which lack several fields the spec requires', async () => {
    const { tdx } = clientWithResponse(carParksFixture);

    const result = await tdx.parking.carParks('Taipei');
    expectTypeOf(result).toEqualTypeOf<ParkingCarParks>();

    expect(result.AuthorityCode).toBe('TPE');
    expect(result.CarParks.map((c) => [c.CarParkID, c.CarParkName.Zh_tw, c.CarParkType])).toEqual([
      ['TPE0448', '三腳渡平面停車場', 1],
      ['TPE0567', '臺北市災害應變中心地下停車場', 3],
    ]);
    const [first] = result.CarParks;
    expect(first?.CarParkShortName).toEqual({});
    expect(first?.Telephone).toBeUndefined();
    expect(first?.TownName).toBeUndefined();
    expect(first?.CarParkPosition.PositionLat).toEqual(expect.any(Number));
  });

  it('parses availability per space type', async () => {
    const { tdx } = clientWithResponse(availabilityFixture);

    const result = await tdx.parking.availability('Taipei');
    expectTypeOf(result).toEqualTypeOf<ParkingAvailabilities>();

    expect(
      result.ParkingAvailabilities.map((a) => [a.CarParkID, a.TotalSpaces, a.AvailableSpaces]),
    ).toEqual([
      ['TPE0096', 1998, 351],
      ['TPE0567', 169, 9],
    ]);
    const cars = result.ParkingAvailabilities[0]?.Availabilities?.find((a) => a.SpaceType === 1);
    expect(cars).toEqual({ SpaceType: 1, NumberOfSpaces: 1998, AvailableSpaces: 351 });
  });

  it('joins only partly: not every availability record has a car park, and vice versa', async () => {
    const carParks = await clientWithResponse(carParksFixture).tdx.parking.carParks('Taipei');
    const availability =
      await clientWithResponse(availabilityFixture).tdx.parking.availability('Taipei');

    const byId = new Map(carParks.CarParks.map((c) => [c.CarParkID, c]));
    const joined = availability.ParkingAvailabilities.filter((a) => byId.has(a.CarParkID));

    expect(joined.map((a) => a.CarParkID)).toEqual(['TPE0567']);
  });

  it('parses on-street segments, including a missing road section end', async () => {
    const { tdx } = clientWithResponse(segmentsFixture);

    const result = await tdx.parking.segments('Taipei');
    expectTypeOf(result).toEqualTypeOf<ParkingSegments>();

    expect(result.ParkingSegments.map((s) => [s.ParkingSegmentID, s.RoadSection])).toEqual([
      ['2047514', { Start: '復興北路', End: '龍江路' }],
      ['6018000', { Start: '大型車' }],
    ]);
    expect(result.ParkingSegments[0]?.Geometry).toMatch(/^POLYGON/);
    expect(result.ParkingSegments[0]?.FareDescription).toBe('40元(09:00-17:00)');
  });

  it('parses segment availability with string occupancy', async () => {
    const { tdx } = clientWithResponse(segmentAvailabilityFixture);

    const result = await tdx.parking.segmentAvailability('Taipei');
    expectTypeOf(result).toEqualTypeOf<ParkingSegmentAvailabilities>();

    expect(
      result.CurbParkingSegmentAvailabilities.map((a) => [
        a.ParkingSegmentID,
        a.AvailableSpaces,
        a.Availabilities[0]?.Occupancy,
      ]),
    ).toEqual([
      ['2047514', 0, '1.0'],
      ['6018000', 16, '0.33'],
    ]);
  });
});
