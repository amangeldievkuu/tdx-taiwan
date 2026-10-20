# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-10-20

### Added

- `TdxClient` with OAuth2 client-credentials auth against TDXConnect: in-memory token cache,
  refresh 60 s before expiry, and deduplicated concurrent refreshes.
- HTTP layer on native `fetch`: retries on 429, 5xx and network errors with exponential
  backoff + full jitter (max 3, honours `Retry-After`), one re-authentication on 401, a
  client-side rate limiter (`requestsPerSecond`, default 5) and per-request timeouts.
- Typed errors: `TdxError`, `TdxAuthError`, `TdxApiError`, `TdxRateLimitError`, `TdxNetworkError`.
- OData query builder (`query()`, `ODataQuery`, `odata.str`) for `$filter`, `$select`,
  `$orderby`, `$top`, `$skip`; `$format=JSON` is always sent.
- Bike endpoints: `bike.stations(city)`, `bike.availability(city)`.
- Bus endpoints: `bus.routes(city, routeName?)`, `bus.stopsOfRoute(city, routeName)`,
  `bus.eta(city, routeName)`.
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
  - Documents that the `{RouteName}` path segment also matches longer route names (`307`
    returns `307西藏三民` too), with an exact-match filter. Verified against the live API.
  - The token-endpoint limit (20/min per IP) now cites TDX's official sample-code docs; API
    limits link to the pricing page.
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
