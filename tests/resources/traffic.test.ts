import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  type TrafficAuthorities,
  type TrafficCCTVs,
  type TrafficCMSLives,
  type TrafficCMSs,
  type TrafficCongestionLevels,
  type TrafficETagPairLives,
  type TrafficETagPairs,
  type TrafficETags,
  type TrafficEvents,
  type TrafficLiveEvents,
  type TrafficLiveTraffic,
  type TrafficLiveTraffics,
  type TrafficNewsList,
  type TrafficSectionLinks,
  type TrafficSectionShapes,
  type TrafficSections,
  type TrafficVDLives,
  type TrafficVDs,
  TdxApiError,
  query,
} from '../../src/index.js';
import { API, clientWithResponse, loadFixture } from '../helpers.js';

const sectionsFixture = loadFixture('traffic-section-taipei.json') as TrafficSections;
const liveFixture = loadFixture('traffic-live-taipei.json') as TrafficLiveTraffics;
const levelsTaipeiFixture = loadFixture(
  'traffic-congestion-level-taipei.json',
) as TrafficCongestionLevels;
const levelsFreewayFixture = loadFixture(
  'traffic-congestion-level-freeway.json',
) as TrafficCongestionLevels;
const cctvFixture = loadFixture('traffic-cctv-taipei.json') as TrafficCCTVs;
const vdFixture = loadFixture('traffic-vd-highway.json') as TrafficVDs;
const vdLiveFixture = loadFixture('traffic-vd-live-freeway.json') as TrafficVDLives;
const etagPairFixture = loadFixture('traffic-etag-pair-freeway.json') as TrafficETagPairs;
const etagLiveFixture = loadFixture('traffic-etag-live-freeway.json') as TrafficETagPairLives;
const newsFixture = loadFixture('traffic-news-freeway.json') as TrafficNewsList;
const eventFixture = loadFixture('traffic-event-taipei.json') as TrafficEvents;
const liveEventFixture = loadFixture('traffic-live-event-freeway.json') as TrafficLiveEvents;
const authorityFixture = loadFixture('traffic-authority.json') as TrafficAuthorities;
const cmsFixture = loadFixture('traffic-cms-freeway.json') as TrafficCMSs;
const cmsLiveFreewayFixture = loadFixture('traffic-cms-live-freeway.json') as TrafficCMSLives;
const cmsLiveTaipeiFixture = loadFixture('traffic-cms-live-taipei.json') as TrafficCMSLives;
const cmsLiveHighwayFixture = loadFixture('traffic-cms-live-highway.json') as TrafficCMSLives;
const etagFixture = loadFixture('traffic-etag-freeway.json') as TrafficETags;
const sectionLinkFixture = loadFixture('traffic-section-link-freeway.json') as TrafficSectionLinks;
const sectionShapeFixture = loadFixture(
  'traffic-section-shape-taipei.json',
) as TrafficSectionShapes;
const sectionByIdFixture = loadFixture('traffic-section-by-id-freeway.json') as TrafficSections;

/** Path segment of each 路況資訊 v2 kind, in method order. */
const KINDS = [
  'Section',
  'Live',
  'CongestionLevel',
  'CCTV',
  'VD',
  'Live/VD',
  'ETagPair',
  'Live/ETag',
  'Live/News',
  'CMS',
  'Live/CMS',
  'ETag',
  'SectionLink',
  'SectionShape',
];
/** Kinds whose city endpoint rejects Taipei in live data; the tests use NewTaipei for them. */
const NEW_TAIPEI_KINDS = new Set(['ETagPair', 'Live/ETag', 'ETag']);

describe('tdx.traffic paths', () => {
  it('requests each city endpoint as JSON', async () => {
    const { tdx, apiUrls } = clientWithResponse({});

    await tdx.traffic.sections('Taipei');
    await tdx.traffic.liveTraffic('Taipei');
    await tdx.traffic.congestionLevels('Taipei');
    await tdx.traffic.cctvs('Taipei');
    await tdx.traffic.vds('Taipei');
    await tdx.traffic.vdLive('Taipei');
    await tdx.traffic.etagPairs('NewTaipei');
    await tdx.traffic.etagPairLive('NewTaipei');
    await tdx.traffic.news('Taipei');
    await tdx.traffic.cms('Taipei');
    await tdx.traffic.cmsLive('Taipei');
    await tdx.traffic.etags('NewTaipei');
    await tdx.traffic.sectionLinks('Taipei');
    await tdx.traffic.sectionShapes('Taipei');

    expect(apiUrls).toEqual(
      KINDS.map(
        (kind) =>
          `${API}/v2/Road/Traffic/${kind}/City/${NEW_TAIPEI_KINDS.has(kind) ? 'NewTaipei' : 'Taipei'}?$format=JSON`,
      ),
    );
  });

  it('requests each freeway and highway endpoint as JSON', async () => {
    const { tdx, apiUrls } = clientWithResponse({});

    for (const scope of [tdx.traffic.freeway, tdx.traffic.highway]) {
      await scope.sections();
      await scope.liveTraffic();
      await scope.congestionLevels();
      await scope.cctvs();
      await scope.vds();
      await scope.vdLive();
      await scope.etagPairs();
      await scope.etagPairLive();
      await scope.news();
      await scope.cms();
      await scope.cmsLive();
      await scope.etags();
      await scope.sectionLinks();
      await scope.sectionShapes();
    }

    expect(apiUrls).toEqual(
      ['Freeway', 'Highway'].flatMap((scope) =>
        KINDS.map((kind) => `${API}/v2/Road/Traffic/${kind}/${scope}?$format=JSON`),
      ),
    );
  });

  it('requests road events from the v1 API, with planned events only where TDX has them', async () => {
    const { tdx, apiUrls } = clientWithResponse({});

    await tdx.traffic.events('Taipei');
    await tdx.traffic.liveEvents('Kaohsiung');
    await tdx.traffic.freeway.liveEvents();
    await tdx.traffic.highway.events();
    await tdx.traffic.highway.liveEvents();

    expect(apiUrls).toEqual(
      [
        '/Event/City/Taipei',
        '/LiveEvent/City/Kaohsiung',
        '/LiveEvent/Freeway',
        '/Event/Highway',
        '/LiveEvent/Highway',
      ].map((path) => `${API}/v1/Traffic/RoadEvent${path}?$format=JSON`),
    );
    expect('events' in tdx.traffic.freeway).toBe(false);
  });

  it('requests one item by ID before the query, and treats a first object as the query', async () => {
    const { tdx, apiUrls } = clientWithResponse({});

    await tdx.traffic.sections('Taipei', 'L_2000100000020A');
    await tdx.traffic.cctvs('Taipei', 'T000001', { select: ['CCTVID'] });
    await tdx.traffic.cms('Taipei', 'X0121C0');
    await tdx.traffic.etags('NewTaipei', '01F0005S');
    await tdx.traffic.sectionShapes('Taipei', 'L_2000100000020A');
    await tdx.traffic.freeway.liveTraffic('0001');
    await tdx.traffic.freeway.etagPairLive('01F0005S-01F0017S');
    await tdx.traffic.highway.vdLive('VD-11-0020-002-002', { top: 1 });
    await tdx.traffic.sections('Taipei', { top: 1 });
    await tdx.traffic.freeway.sections({ top: 1 });

    expect(apiUrls).toEqual([
      `${API}/v2/Road/Traffic/Section/City/Taipei/L_2000100000020A?$format=JSON`,
      `${API}/v2/Road/Traffic/CCTV/City/Taipei/T000001?$select=CCTVID&$format=JSON`,
      `${API}/v2/Road/Traffic/CMS/City/Taipei/X0121C0?$format=JSON`,
      `${API}/v2/Road/Traffic/ETag/City/NewTaipei/01F0005S?$format=JSON`,
      `${API}/v2/Road/Traffic/SectionShape/City/Taipei/L_2000100000020A?$format=JSON`,
      `${API}/v2/Road/Traffic/Live/Freeway/0001?$format=JSON`,
      `${API}/v2/Road/Traffic/Live/ETag/Freeway/01F0005S-01F0017S?$format=JSON`,
      `${API}/v2/Road/Traffic/Live/VD/Highway/VD-11-0020-002-002?$top=1&$format=JSON`,
      `${API}/v2/Road/Traffic/Section/City/Taipei?$top=1&$format=JSON`,
      `${API}/v2/Road/Traffic/Section/Freeway?$top=1&$format=JSON`,
    ]);
  });

  it('requests the authority list', async () => {
    const { tdx, apiUrls } = clientWithResponse({});

    await tdx.traffic.authorities();

    expect(apiUrls).toEqual([`${API}/v2/Road/Traffic/Basic/Authority?$format=JSON`]);
  });

  it('applies queries to the items inside the wrapper', async () => {
    const { tdx, apiUrls } = clientWithResponse({});

    await tdx.traffic.liveTraffic(
      'Taipei',
      query<TrafficLiveTraffic>().filter("CongestionLevel eq '4'").top(5),
    );
    await tdx.traffic.freeway.liveEvents({ filter: 'EventType eq 1', orderBy: 'EffectiveTime' });

    expect(apiUrls.map((u) => decodeURIComponent(u))).toEqual([
      `${API}/v2/Road/Traffic/Live/City/Taipei?$filter=CongestionLevel eq '4'&$top=5&$format=JSON`,
      `${API}/v1/Traffic/RoadEvent/LiveEvent/Freeway?$filter=EventType eq 1&$orderby=EffectiveTime&$format=JSON`,
    ]);
  });

  it('validates the city', () => {
    const { tdx } = clientWithResponse({});

    expect(() => tdx.traffic.sections('')).toThrow(TypeError);
    expect(() => tdx.traffic.sections('Taipei', ' ')).toThrow(TypeError);
    expect(() => tdx.traffic.freeway.cms('')).toThrow(TypeError);
    expect(() => tdx.traffic.etagPairs('  ')).toThrow(TypeError);
    expect(() => tdx.traffic.liveEvents('')).toThrow(TypeError);
  });

  it('rejects an array where a wrapper object is expected', async () => {
    const { tdx } = clientWithResponse([]);

    await expect(tdx.traffic.freeway.liveTraffic()).rejects.toBeInstanceOf(TdxApiError);
    await expect(tdx.traffic.authorities()).rejects.toBeInstanceOf(TdxApiError);
  });
});

describe('tdx.traffic parsing', () => {
  it('joins live traffic to sections and congestion level names', async () => {
    const sections = await clientWithResponse(sectionsFixture).tdx.traffic.sections('Taipei');
    const live = await clientWithResponse(liveFixture).tdx.traffic.liveTraffic('Taipei');
    const levels =
      await clientWithResponse(levelsTaipeiFixture).tdx.traffic.congestionLevels('Taipei');
    expectTypeOf(sections).toEqualTypeOf<TrafficSections>();
    expectTypeOf(live).toEqualTypeOf<TrafficLiveTraffics>();
    expectTypeOf(levels).toEqualTypeOf<TrafficCongestionLevels>();

    expect(sections.AuthorityCode).toBe('TPE');
    expect(sections.Count).toBeUndefined();
    expect(sections.Sections.map((s) => [s.SectionID, s.RoadName, s.SectionLength])).toEqual([
      ['L_2000100000020A', '水源快速道路', 0.5169],
      ['L_2000100000090A', '水源快速道路', 0.1344],
    ]);

    const scale = levels.CongestionLevels[0];
    const nameOf = new Map(scale?.Levels.map((l) => [String(l.Level), l.LevelName]));
    expect(scale?.CongestionLevelID).toBe('RoadClass2_default');
    expect(scale?.Levels.map((l) => l.Level)).toEqual([1, 2, 3, 4, 5, 6]); // level 6 is Taipei's
    expect(
      live.LiveTraffics.map((t) => [
        t.SectionID,
        t.TravelSpeed,
        t.TravelTime,
        nameOf.get(t.CongestionLevel) ?? t.CongestionLevel,
      ]),
    ).toEqual([
      ['L_2000100000500A', 73, 30, 'A'],
      ['L_2000101007000A', 25, 33, 'F'],
      ['L_2000100100680F', -99, -99, '-99'],
    ]);
    expect(live.LiveTraffics[0]?.DataSources.HasVD).toBe(1);
  });

  it('parses the freeway congestion scale with its closed level', async () => {
    const { tdx } = clientWithResponse(levelsFreewayFixture);

    const levels = await tdx.traffic.freeway.congestionLevels();
    const closed = levels.CongestionLevels[0]?.Levels.find((l) => l.Level === -1);

    expect(levels.CongestionLevels[0]?.MeasureIndex).toBe('Speed');
    expect(closed).toEqual({ Level: -1, LevelName: '道路封閉', TopValue: -1, LowValue: -1 });
  });

  it('parses cameras, including the out-of-spec surveillance type', async () => {
    const { tdx } = clientWithResponse(cctvFixture);

    const cameras = await tdx.traffic.cctvs('Taipei');
    expectTypeOf(cameras).toEqualTypeOf<TrafficCCTVs>();

    expect(cameras.CCTVs.map((c) => [c.CCTVID, c.RoadName, c.SurveillanceType])).toEqual([
      ['T000001', '市民大道一段', -1],
      ['T000002', '環河快速道路', -1],
    ]);
    expect(cameras.CCTVs[0]?.VideoStreamURL).toMatch(/^https:\/\/hls\.bote\.gov\.taipei\//);
  });

  it('parses detectors and their live lane flows', async () => {
    const vds = await clientWithResponse(vdFixture).tdx.traffic.highway.vds();
    const live = await clientWithResponse(vdLiveFixture).tdx.traffic.freeway.vdLive();
    expectTypeOf(vds).toEqualTypeOf<TrafficVDs>();
    expectTypeOf(live).toEqualTypeOf<TrafficVDLives>();

    const vd = vds.VDs[0];
    expect([vd?.VDID, vd?.BiDirectional, vd?.RoadName]).toEqual(['VD-11-0020-002-002', 1, '台2線']);
    expect(vd?.DetectionLinks.map((l) => [l.Bearing, l.RoadDirection])).toEqual([
      ['N', 'E'],
      ['S', 'W'],
    ]);

    const lane = live.VDLives[0]?.LinkFlows[0]?.Lanes[0];
    expect(live.VDLives[0]?.Status).toBe(0);
    expect([lane?.LaneID, lane?.Speed, lane?.Occupancy]).toEqual([0, 19, 10]);
    expect(lane?.Vehicles.map((v) => [v.VehicleType, v.Volume])).toEqual([
      ['S', 2],
      ['L', 0],
      ['T', 0],
    ]);
  });

  it('parses eTag pairs and their live travel times', async () => {
    const pairs = await clientWithResponse(etagPairFixture).tdx.traffic.freeway.etagPairs();
    const live = await clientWithResponse(etagLiveFixture).tdx.traffic.freeway.etagPairLive();
    expectTypeOf(pairs).toEqualTypeOf<TrafficETagPairs>();
    expectTypeOf(live).toEqualTypeOf<TrafficETagPairLives>();

    expect(pairs.LinkVersion).toBe('25.06.1');
    expect(pairs.ETagPairs[0]).toMatchObject({ ETagPairID: '01F0005S-01F0017S', Distance: 1.2 });
    expect(pairs.ETagPairs[0]?.Geometry).toMatch(/^LINESTRING \(/);
    expect(
      live.ETagPairLives[0]?.Flows.map((f) => [f.VehicleType, f.TravelTime, f.SpaceMeanSpeed]),
    ).toEqual([
      [31, 46, 94],
      [32, 49, 88],
      [41, 47, 92],
      [42, 60, 72],
      [5, 0, 0],
    ]);
  });

  it('parses freeway news without the description the spec requires', async () => {
    const { tdx } = clientWithResponse(newsFixture);

    const news = await tdx.traffic.freeway.news();
    expectTypeOf(news).toEqualTypeOf<TrafficNewsList>();

    expect(news.Newses.map((n) => [n.Title, n.NewsCategory, n.Description])).toEqual([
      ['封閉預告', 99, undefined],
      ['封閉預告', 99, undefined],
    ]);
    expect(news.Newses[0]?.UpdateTime).toBe('0001-01-01T00:00:00+08:06');
  });

  it('parses planned and live road events', async () => {
    const planned = await clientWithResponse(eventFixture).tdx.traffic.events('Taipei');
    const live = await clientWithResponse(liveEventFixture).tdx.traffic.freeway.liveEvents();
    expectTypeOf(planned).toEqualTypeOf<TrafficEvents>();
    expectTypeOf(live).toEqualTypeOf<TrafficLiveEvents>();

    expect(planned.Events[0]).toMatchObject({ EventTitle: '第24屆臺灣同志遊行', EventType: 7 });
    expect(planned.Events[0]?.Location.Other).toMatch(/^北路線/);
    expect(
      live.LiveEvents.map((e) => [
        e.EventTitle,
        e.EventType,
        e.Location.FreeExpressHighway?.Road,
        e.Location.FreeExpressHighway?.Interchange,
        e.Impact?.Severity,
        e.Impact?.BlockedLanes,
      ]),
    ).toEqual([
      ['壅塞事件', 3, '國道一號', '林口', 0, '-1'],
      ['施工事件', 2, '國道一號', undefined, 1, '2,RS'],
    ]);
  });

  it('parses signs and their live messages, including blank highway signs', async () => {
    const signs = await clientWithResponse(cmsFixture).tdx.traffic.freeway.cms();
    const freeway = await clientWithResponse(cmsLiveFreewayFixture).tdx.traffic.freeway.cmsLive();
    const taipei = await clientWithResponse(cmsLiveTaipeiFixture).tdx.traffic.cmsLive('Taipei');
    const highway = await clientWithResponse(cmsLiveHighwayFixture).tdx.traffic.highway.cmsLive();
    expectTypeOf(signs).toEqualTypeOf<TrafficCMSs>();
    expectTypeOf(freeway).toEqualTypeOf<TrafficCMSLives>();

    expect(signs.CMSs.map((c) => [c.CMSID, c.RoadName, c.LocationMile])).toEqual([
      ['CMS-N1-S-0.000-M', '國道1號', '0K+000'],
      [expect.any(String), '國道1號', expect.any(String)],
    ]);
    expect(freeway.CMSLives[0]).toMatchObject({ CMSID: 'CMS-N1-S-0.000-M', MessageStatus: 1 });
    expect(freeway.CMSLives[0]?.Messages[0]).toEqual({
      Text: '平面10-15K內線移動施工請小心駕駛',
      Type: 7,
      Priority: 51,
    });
    expect(taipei.CMSLives[0]?.Messages).toEqual([{ Text: '經路口慢看停' }]);
    expect([highway.CMSLives[0]?.MessageStatus, highway.CMSLives[0]?.Messages[0]?.Text]).toEqual([
      0,
      ' ',
    ]);
  });

  it('parses gantries, section links and section shapes', async () => {
    const gantries = await clientWithResponse(etagFixture).tdx.traffic.freeway.etags();
    const links = await clientWithResponse(sectionLinkFixture).tdx.traffic.freeway.sectionLinks();
    const shapes =
      await clientWithResponse(sectionShapeFixture).tdx.traffic.sectionShapes('Taipei');
    expectTypeOf(gantries).toEqualTypeOf<TrafficETags>();
    expectTypeOf(links).toEqualTypeOf<TrafficSectionLinks>();
    expectTypeOf(shapes).toEqualTypeOf<TrafficSectionShapes>();

    expect(gantries.ETags[0]).toMatchObject({
      ETagGantryID: '01F0005S',
      LocationType: 4,
      RoadSection: { Start: '基隆端', End: '基隆' },
    });
    expect(links.SectionLinks[0]?.SectionID).toBe('0001');
    expect(links.SectionLinks[0]?.LinkIDs?.map((l) => l.LinkID)).toEqual([
      '0000100000000C',
      '0000100000040C',
      '0000100000080C',
      '0000100000110C',
    ]);
    expect(shapes.SectionShapes[0]?.SectionID).toBe('L_2000100000020A');
    expect(shapes.SectionShapes[0]?.Geometry).toMatch(/^LINESTRING\(/);
  });

  it('parses a by-ID wrapper with its single item', async () => {
    const { tdx } = clientWithResponse(sectionByIdFixture);

    const result = await tdx.traffic.freeway.sections('0001');
    expectTypeOf(result).toEqualTypeOf<TrafficSections>();

    expect(result.Sections.map((s) => [s.SectionID, s.SectionName])).toEqual([
      ['0001', '國道1號(基隆端到基隆)'],
    ]);
  });

  it('parses the authority list', async () => {
    const { tdx } = clientWithResponse(authorityFixture);

    const result = await tdx.traffic.authorities();
    expectTypeOf(result).toEqualTypeOf<TrafficAuthorities>();

    expect(result.UpdateInterval).toBe(-1);
    expect(result.Authorities.map((a) => [a.AuthorityCode, a.NameZh_tw])).toEqual([
      ['NFB', '高速公路局'],
      ['THB', '公路局'],
      ['THBSH', '公路局蘇花公路改善工程處交控中心'],
    ]);
  });
});
