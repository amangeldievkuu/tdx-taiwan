export const DEFAULT_AUTH_URL =
  'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token';

export const DEFAULT_BASE_URL = 'https://tdx.transportdata.tw/api/basic';

/** Refresh the access token this long before it expires. */
export const TOKEN_REFRESH_MARGIN_MS = 60_000;

export const DEFAULT_TIMEOUT_MS = 30_000;

export const DEFAULT_REQUESTS_PER_SECOND = 5;

export const DEFAULT_MAX_RETRIES = 3;
