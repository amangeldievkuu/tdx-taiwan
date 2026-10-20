/** Base class for every error thrown by this SDK. */
export class TdxError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
  }
}

/** Obtaining an access token failed (bad credentials, network error, malformed token response). */
export class TdxAuthError extends TdxError {
  /** HTTP status of the token endpoint response, if one was received. */
  readonly status: number | undefined;
  /** Raw response body of the token endpoint, if one was received. */
  readonly body: string | undefined;

  constructor(message: string, details: { status?: number; body?: string; cause?: unknown } = {}) {
    super(message, { cause: details.cause });
    this.status = details.status;
    this.body = details.body;
  }
}

/** The TDX API responded with an error status, or with a body that could not be parsed. */
export class TdxApiError extends TdxError {
  /** HTTP status code. */
  readonly status: number;
  /** Raw response body (TDX usually returns `{"Message": "..."}` on errors). */
  readonly body: string;
  /** Request URL. */
  readonly url: string;

  constructor(
    message: string,
    details: { status: number; body: string; url: string; cause?: unknown },
  ) {
    super(message, { cause: details.cause });
    this.status = details.status;
    this.body = details.body;
    this.url = details.url;
  }
}

/** HTTP 429 persisted after all retries were exhausted. */
export class TdxRateLimitError extends TdxApiError {
  /** Server-suggested wait from the `Retry-After` header, in milliseconds. */
  readonly retryAfterMs: number | undefined;

  constructor(
    message: string,
    details: { body: string; url: string; retryAfterMs?: number; cause?: unknown },
  ) {
    super(message, { ...details, status: 429 });
    this.retryAfterMs = details.retryAfterMs;
  }
}

/** The request never got an HTTP response (DNS failure, connection reset, timeout). */
export class TdxNetworkError extends TdxError {
  readonly url: string;

  constructor(message: string, details: { url: string; cause?: unknown }) {
    super(message, { cause: details.cause });
    this.url = details.url;
  }
}
