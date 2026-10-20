// Shared TDX schema types (PTX.Service.DTO.Shared.Specification.V2.Base.*).
// Optional (`?`) means the field is not in the schema's `required` list;
// `| null` means the schema marks it `nullable`.

/** Multilingual name (NameType). */
export interface NameType {
  /** Traditional Chinese name. */
  Zh_tw: string;
  /** English name. */
  En?: string | null;
  /** Japanese name. */
  Ja?: string | null;
  /** Korean name. */
  Ko?: string | null;
}

/** WGS84 point (PointType). */
export interface PointType {
  /** Longitude (WGS84). */
  PositionLon?: number | null;
  /** Latitude (WGS84). */
  PositionLat?: number | null;
  /** Geohash of the position. */
  GeoHash?: string | null;
}

/** ISO 8601 timestamp with offset, e.g. `2026-10-20T10:15:30+08:00`. */
export type DateTimeString = string;

/**
 * Allows any string while keeping editor autocomplete for the known literals,
 * so cities TDX adds later still type-check.
 */
export type OpenString<Known extends string> = Known | (string & {});
