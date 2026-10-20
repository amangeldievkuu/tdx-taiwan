import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  type BikeAvailability,
  type BikeStation,
  TdxApiError,
  odata,
  query,
} from '../../src/index.js';
import { API, clientWithResponse, loadFixture } from '../helpers.js';

const stationsFixture = loadFixture('bike-station-taipei.json') as BikeStation[];
const availabilityFixture = loadFixture('bike-availability-taipei.json') as BikeAvailability[];

describe('tdx.bike.stations', () => {
  it('requests the city station list as JSON', async () => {
    const { tdx, apiUrls } = clientWithResponse(stationsFixture);

    await tdx.bike.stations('Taipei');

    expect(apiUrls).toEqual([`${API}/v2/Bike/Station/City/Taipei?$format=JSON`]);
  });

  it('parses stations, including partial names and null capacity', async () => {
    const { tdx } = clientWithResponse(stationsFixture);

    const stations = await tdx.bike.stations('Taipei');
    expectTypeOf(stations).toEqualTypeOf<BikeStation[]>();

    expect(stations).toHaveLength(3);
    expect(stations[0]).toMatchObject({
      StationUID: 'TPE500101001',
      StationName: { Zh_tw: 'YouBike2.0_捷運科技大樓站' },
      StationPosition: { PositionLat: 25.02605, PositionLon: 121.54357 },
      BikesCapacity: 28,
      ServiceType: 2,
    });
    expect(stations[2]?.StationName?.En).toBeUndefined();
    expect(stations[2]?.BikesCapacity).toBeNull();
  });

  it('passes OData queries through', async () => {
    const { tdx, apiUrls } = clientWithResponse([]);

    await tdx.bike.stations(
      'NewTaipei',
      query<BikeStation>()
        .filter(`StationName/Zh_tw eq ${odata.str('捷運板橋站')}`)
        .select('StationUID', 'StationName')
        .top(1),
    );

    expect(decodeURIComponent(apiUrls[0] ?? '')).toBe(
      `${API}/v2/Bike/Station/City/NewTaipei?$select=StationUID,StationName` +
        `&$filter=StationName/Zh_tw eq '捷運板橋站'&$top=1&$format=JSON`,
    );
  });
});

describe('tdx.bike.availability', () => {
  it('requests real-time availability for a city', async () => {
    const { tdx, apiUrls } = clientWithResponse(availabilityFixture);

    await tdx.bike.availability('Kaohsiung', { filter: 'AvailableRentBikes gt 0' });

    expect(decodeURIComponent(apiUrls[0] ?? '')).toBe(
      `${API}/v2/Bike/Availability/City/Kaohsiung?$filter=AvailableRentBikes gt 0&$format=JSON`,
    );
  });

  it('parses availability, including null counts and missing detail', async () => {
    const { tdx } = clientWithResponse(availabilityFixture);

    const availability = await tdx.bike.availability('Taipei');
    expectTypeOf(availability).toEqualTypeOf<BikeAvailability[]>();

    expect(availability.map((a) => a.AvailableRentBikes)).toEqual([6, 0, null]);
    expect(availability[0]?.AvailableRentBikesDetail).toEqual({
      GeneralBikes: 5,
      ElectricBikes: 1,
    });
    expect(availability[2]).toMatchObject({ ServiceStatus: 2, AvailableReturnBikes: null });
    expect(availability[2]?.AvailableRentBikesDetail).toBeUndefined();
  });

  it('rejects a non-array response', async () => {
    const { tdx } = clientWithResponse({ Message: 'unexpected' });

    await expect(tdx.bike.availability('Taipei')).rejects.toBeInstanceOf(TdxApiError);
  });

  it('validates the city argument', () => {
    const { tdx } = clientWithResponse([]);

    expect(() => tdx.bike.stations('')).toThrow(TypeError);
  });
});
