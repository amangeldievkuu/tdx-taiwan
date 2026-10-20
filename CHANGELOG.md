# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Releases are published from GitHub Actions with npm trusted publishing, so each version
  carries [provenance](https://docs.npmjs.com/generating-provenance-statements) linking it to
  the source commit and workflow run.

## [0.1.0] - 2026-10-20

### Added

- `TdxClient` with OAuth2 client-credentials auth against TDXConnect: in-memory token cache,
  refresh 60 s before expiry, and deduplicated concurrent refreshes.
- HTTP layer on native `fetch`: retries on 429, 5xx and network errors with exponential
  backoff + full jitter (max 3, honours `Retry-After`), one re-authentication on 401, a
  client-side rate limiter (`requestsPerSecond`, default 5) and per-request timeouts.
- Typed errors: `TdxError`, `TdxAuthError`, `TdxApiError`, `TdxRateLimitError`, `TdxNetworkError`.
- OData query builder (`query()`, `ODataQuery`, `odata.str`, `clone()`) for `$filter`, `$select`,
  `$orderby`, `$top`, `$skip`; `$format=JSON` is always sent.
- Bike endpoints: `bike.stations(city)`, `bike.availability(city)`.
- Bus endpoints: `bus.routes(city, routeName?)`, `bus.stopsOfRoute(city, routeName)`,
  `bus.eta(city, routeName)`. Route names match `RouteName/Zh_tw` exactly by default;
  `{ exact: false }` keeps TDX's prefix matching.
- Response types transcribed from the TDX OpenAPI specs (Bike v2, Bus v2).
- Optional in-memory TTL response cache (1 h for static data, 15 s for real-time data).
- `tdx.get(path, query?)` for TDX endpoints not wrapped yet.
- `onRequest({ url })` and `onRetry({ url, attempt, status, delayMs })` hooks on
  `TdxClient` options, for logging and metrics.
- NestJS integration at `tdx-taiwan/nestjs`: `TdxModule.forRoot()` / `forRootAsync()`.
  Injection uses `useFactory` and explicit tokens only, so it does not depend on decorator
  metadata. Tested against `@nestjs/common` v10, v11 and v12.
- Example: `examples/nearest-youbike.ts`.

### Pre-release changes

- Package metadata: `repository`, `homepage`, `bugs` and `publishConfig.access: public`.
- Minimum Node.js is now 20 (`engines: >=20`, build target `node20`); Node 18 is end-of-life.
- Type declarations rely on `@types/node` for `fetch` types; the `DOM` lib is no longer used.
- README:
  - The NestJS example uses an explicit `@Inject(TdxClient)`.
  - Documents exact route-name matching and the `exact: false` option.
  - The token-endpoint limit (20/min per IP) now cites TDX's official sample-code docs; API
    limits link to the pricing page.
- Bus route names now match exactly by default. TDX matches the `{RouteName}` path segment
  as a prefix (`307` also returned `307西藏三民`; `紅5` also returned `紅50`, `紅55`, …), so the
  SDK adds a `RouteName/Zh_tw eq '…'` filter. Pass `{ exact: false }` for the old behaviour.
  Query builders passed in are copied, not modified. Verified against the live API: every
  city's ETA records carry `RouteName`, so the filter drops nothing.
- Route names containing `/` (some Kinmen routes) previously returned 404; with exact matching
  the SDK requests the part before the `/` and filters on the full name.
- Tooling and tests:
  - ESLint uses `strictTypeChecked` with the project service.
  - The Vitest integration config extends the base config through `mergeConfig`.
  - New tests run the built `dist/` in a plain Node process: NestJS resolution of `TdxClient`
    from the ESM and CJS bundles (without decorator metadata), and an open-handles check
    showing that no timers keep the process alive.
  - CI runs the dist tests against each NestJS major and smoke-tests the packed tarball on
    Node 20, 22 and 24.

[Unreleased]: https://github.com/amangeldievkuu/tdx-taiwan/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/amangeldievkuu/tdx-taiwan/releases/tag/v0.1.0
