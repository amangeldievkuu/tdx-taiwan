import { describe, expect, expectTypeOf, it } from 'vitest';
import { ODataQuery, type FieldPath, odata, query } from '../../src/odata/query-builder.js';

interface Station {
  StationUID: string;
  StationName: { Zh_tw: string; En?: string };
  BikesCapacity?: number | null;
  Tags: string[];
}

const decode = (q: { toString(): string }) => decodeURIComponent(q.toString());

describe('ODataQuery', () => {
  it('always requests JSON', () => {
    expect(query().toString()).toBe('$format=JSON');
  });

  it('builds each operator', () => {
    const q = query<Station>()
      .select('StationUID', 'BikesCapacity')
      .filter('BikesCapacity gt 10')
      .orderBy('BikesCapacity', 'desc')
      .top(5)
      .skip(10);

    expect(decode(q)).toBe(
      '$select=StationUID,BikesCapacity&$filter=BikesCapacity gt 10' +
        '&$orderby=BikesCapacity desc&$top=5&$skip=10&$format=JSON',
    );
  });

  it('joins multiple filters with and, parenthesised', () => {
    const q = query().filter('A eq 1 or A eq 2').filter('B gt 3').filter('  ');
    expect(decode(q)).toBe('$filter=(A eq 1 or A eq 2) and (B gt 3)&$format=JSON');
  });

  it('supports nested paths and multiple sort keys', () => {
    const q = query<Station>().orderBy('StationName/Zh_tw').orderBy('StationUID', 'desc');
    expect(decode(q)).toBe('$orderby=StationName/Zh_tw,StationUID desc&$format=JSON');
  });

  it('deduplicates selected fields', () => {
    expect(decode(query<Station>().select('StationUID').select('StationUID'))).toBe(
      '$select=StationUID&$format=JSON',
    );
  });

  it('percent-encodes values (spaces as %20, quotes, CJK) but keeps $ in keys', () => {
    const q = query().filter(`StationName/Zh_tw eq ${odata.str('捷運市政府站(3號出口)')}`);
    const raw = q.toString();

    expect(raw.startsWith('$filter=')).toBe(true);
    expect(raw).not.toContain(' ');
    expect(raw).not.toContain('+');
    expect(raw).toContain('%20eq%20');
    expect(raw).toContain(encodeURIComponent('捷運市政府站'));
    expect(decode(q)).toBe("$filter=StationName/Zh_tw eq '捷運市政府站(3號出口)'&$format=JSON");
  });

  it('rejects invalid $top / $skip', () => {
    expect(() => query().top(-1)).toThrow(RangeError);
    expect(() => query().top(1.5)).toThrow(RangeError);
    expect(() => query().skip(Number.NaN)).toThrow(RangeError);
    expect(decode(query().top(0))).toBe('$top=0&$format=JSON');
  });

  it('builds from a plain options object', () => {
    const q = ODataQuery.from<Station>({
      filter: ['BikesCapacity gt 0', "StationUID eq 'TPE1'"],
      select: ['StationUID'],
      orderBy: [
        ['BikesCapacity', 'desc'],
        ['StationUID', 'asc'],
      ],
      top: 3,
    });
    expect(decode(q)).toBe(
      "$select=StationUID&$filter=(BikesCapacity gt 0) and (StationUID eq 'TPE1')" +
        '&$orderby=BikesCapacity desc,StationUID&$top=3&$format=JSON',
    );
  });

  it('accepts a single orderBy field or tuple in options', () => {
    expect(decode(ODataQuery.from<Station>({ orderBy: 'StationUID' }))).toBe(
      '$orderby=StationUID&$format=JSON',
    );
    expect(decode(ODataQuery.from<Station>({ orderBy: ['StationUID', 'desc'] }))).toBe(
      '$orderby=StationUID desc&$format=JSON',
    );
  });

  it('passes through an existing builder and handles undefined', () => {
    const q = query().top(1);
    expect(ODataQuery.from(q)).toBe(q);
    expect(ODataQuery.from(undefined).toString()).toBe('$format=JSON');
  });

  it('clones independently of the original', () => {
    const original = query<Station>()
      .filter('a eq 1')
      .select('StationUID')
      .orderBy('StationUID')
      .top(5)
      .skip(1);
    const copy = original.clone().filter('b eq 2').select('Tags');

    expect(original.toString()).toBe(
      '$select=StationUID&$filter=a%20eq%201&$orderby=StationUID&$top=5&$skip=1&$format=JSON',
    );
    expect(decodeURIComponent(copy.toString())).toBe(
      '$select=StationUID,Tags&$filter=(a eq 1) and (b eq 2)&$orderby=StationUID&$top=5&$skip=1' +
        '&$format=JSON',
    );
  });

  it('adds a nearby spatial filter, from the builder or options, and clones it', () => {
    expect(decode(query().nearby(25.0478, 121.517, 300).top(5))).toBe(
      '$top=5&$spatialFilter=nearby(25.0478,121.517,300)&$format=JSON',
    );
    const fromOptions = ODataQuery.from<Station>({
      select: ['StationUID'],
      nearby: { lat: 22.6394, lon: 120.3022, meters: 200 },
    });
    expect(decode(fromOptions)).toBe(
      '$select=StationUID&$spatialFilter=nearby(22.6394,120.3022,200)&$format=JSON',
    );
    expect(decode(fromOptions.clone())).toBe(decode(fromOptions));
  });

  it('rejects an invalid nearby area', () => {
    expect(() => query().nearby(91, 121, 100)).toThrow(RangeError);
    expect(() => query().nearby(25, Number.NaN, 100)).toThrow(RangeError);
    expect(() => query().nearby(25, 121, 0)).toThrow(RangeError);
    expect(() => query().nearby(25, 121, 12.5)).toThrow(RangeError);
  });

  it('types field names against the item type', () => {
    expectTypeOf<FieldPath<Station>>().toEqualTypeOf<
      | 'StationUID'
      | 'StationName'
      | 'StationName/Zh_tw'
      | 'StationName/En'
      | 'BikesCapacity'
      | 'Tags'
    >();
    // @ts-expect-error unknown field
    query<Station>().select('Nope');
    // @ts-expect-error nested paths are not selectable
    query<Station>().select('StationName/Zh_tw');
  });
});

describe('odata.str', () => {
  it('quotes and escapes single quotes', () => {
    expect(odata.str("O'Neil's")).toBe("'O''Neil''s'");
    expect(odata.str('')).toBe("''");
  });
});
