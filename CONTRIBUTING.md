# Contributing

## Setup

Development tooling needs Node.js 22 or later (the published package supports 20+).

```sh
npm ci
cp .env.example .env   # only needed for the live tests and the examples
```

## Scripts

| Script                     | What it does                                                                                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                 | Unit tests against the fixtures (builds `dist/` first and tests the bundle too). Never calls TDX.                                                    |
| `npm run test:watch`       | The same, in watch mode.                                                                                                                             |
| `npm run test:integration` | Live tests; skipped unless `TDX_CLIENT_ID` and `TDX_CLIENT_SECRET` are set. 150 s timeout, because TDX may answer 429 with `Retry-After` up to 30 s. |
| `npm run lint`             | `eslint .` and `prettier --check .` (Markdown and JSON included).                                                                                    |
| `npm run format`           | `prettier --write .`                                                                                                                                 |
| `npm run typecheck`        | `tsc --noEmit`                                                                                                                                       |
| `npm run build`            | `tsup` → ESM + CJS + declarations in `dist/`.                                                                                                        |
| `npm run check:exports`    | `publint` and `are-the-types-wrong` on the packed tarball.                                                                                           |
| `npm run example:<name>`   | One of `youbike`, `metro`, `thsr`, `tra`, `parking`, `ev`, `flights`, `traffic`, `ferry`.                                                            |

## Adding or changing an endpoint

1. **Fetch the spec.** The TDX swagger groups are listed at
   `https://tdx.transportdata.tw/webapi/serviceCategory/ForSwagger` (JSON; each group has an `id`,
   a `name` such as `公共運輸-航空` and a `version`). The OpenAPI document of a group is
   `https://tdx.transportdata.tw/webapi/File/Swagger/V2/<id>`.
2. **Transcribe the types** into `src/types/<resource>.ts`: keep TDX's field names, put the
   schema name in the JSDoc (`/** Station (BikeStation). */`), use `?` for fields not in the
   schema's `required` list and `| null` for fields it marks `nullable`, and type path values
   (cities, rail systems) as `OpenString` unions so unknown values still compile.
3. **Check every endpoint live** once (with `tdx.get` or the new method, `$top=1`). Where the
   data departs from the spec (missing required fields, extra fields, values outside an enum,
   differently named arrays), make the type follow the data and say so in the JSDoc and in
   `docs/<resource>.md`.
4. **Wrap it** in `src/resources/<resource>.ts`: `list` for array responses, `object` for wrapper
   objects (the query then applies to the items), `segment()` for path parameters, cache class
   `'static'` or `'realtime'`. Method JSDoc order: description, "Cached with the … TTL.", then the
   `` `GET …` `` path. Optional trailing path segments use the `optional()` helper.
5. **Export** the class from `src/index.ts` (`export type *` for the types), wire it into
   `TdxClient`, add a row to the README resource index, write `docs/<resource>.md` using the
   same headings as the other pages, and add an example script plus its `example:<name>` script.
6. **Fixtures and tests.** `tests/fixtures/<resource>-<kind>[-<city>].json` are trimmed live
   responses fetched through the SDK: cut to one to three items, never hand-edited (if an edit is
   unavoidable, say so in `tests/fixtures/README.md`), dated, and kept where they show a
   departure from the spec. Add a paragraph to `tests/fixtures/README.md`. Unit tests in
   `tests/resources/<resource>.test.ts` assert the request URL for every method, the query
   pass-through, path validation, the wrong-shape error and the parsed values; add the resource
   to `tests/cache/client-cache.test.ts`; keep the live block in `tests/integration/live.test.ts`
   to about three calls.
7. **Changelog.** Describe the change under `## [Unreleased]` in `CHANGELOG.md`.

## Rate limits when probing

The token endpoint allows 20 requests per minute per IP. The API limit depends on the plan, and
bursts of more than about five quick calls are answered with 429. Keep `requestsPerSecond` at 5
or below, use `$top=1` while exploring, and leave a few seconds between raw `curl` calls.

## Documentation

- The README is the quick start plus a resource index; everything specific to a resource lives
  in `docs/<resource>.md`, and rules shared by all resources in `docs/conventions.md`.
- npm shows only the README, so links from the README to `docs/` or `CONTRIBUTING.md` are
  absolute GitHub URLs. Links inside `docs/` are relative.
- `tests/docs/links.test.ts` checks every link and heading anchor in the Markdown files and
  that the README stays under 350 lines. Run `npm run format` after editing Markdown.

## Releasing

1. Move the `## [Unreleased]` items under `## [x.y.z] - YYYY-MM-DD`, add the compare link at
   the bottom of `CHANGELOG.md` and re-point `[Unreleased]`.
2. `npm version minor` (or `patch` / `major`) bumps `package.json`, commits and tags `vX.Y.Z`.
3. `git push --follow-tags`. The release workflow checks that the tag matches `package.json`,
   runs lint, typecheck, tests, build and the export checks, publishes to npm with provenance,
   and creates the GitHub release from the matching `CHANGELOG.md` section.
