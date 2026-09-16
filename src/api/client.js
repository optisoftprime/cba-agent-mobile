import { create, isAxiosError } from 'axios';

import { BASE_URL, LOG_API, REQUEST_TIMEOUT_MS } from '@/config/backend';
import i18n from '@/i18n';
import { load, StorageKeys } from '@/lib/storage';

/**
 * Two clients, and which one a call uses is the whole auth story:
 *
 *   publicApi — pre-login calls: device activation, login, forgot password.
 *               Never sends a token. A 401 here is an ordinary error (wrong
 *               code, bad password) and is handed back to the screen.
 *   api       — everything after login. Sends the bearer token, and a 401
 *               means the session is gone: the user is signed out. A single
 *               call can opt out of that with `{ skipSessionExpiry: true }`
 *               when it handles the 401 itself (the startup check).
 *
 * Rize Spring keeps one client and a list of public paths matched with
 * `url.includes(...)` — a substring match, so it drifts and misfires. Here a
 * call is public because of the client it was written against, which can't
 * drift.
 */

// ── Session expiry ──────────────────────────────────────────────────────────
// The API layer can't import the AuthProvider (that would be a cycle), so the
// provider registers what "signed out" means and the interceptor calls it.
let onSessionExpired = null;
let isHandlingExpiry = false;

export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

/**
 * A 401 only ends the session it was SENT WITH.
 *
 * A screen can fire several requests on one expired token; their 401s arrive
 * spread out, some after the sign-out has already finished. And a slow request
 * from an old session can come back after the user has logged in again. In
 * both cases the token the request carried is no longer the current one, so
 * the session it belonged to is already over — acting on it would mean a
 * second "session expired" toast, or signing out a perfectly good new session.
 */
async function handleUnauthorized(sentToken) {
  if (isHandlingExpiry || !onSessionExpired || !sentToken) return;

  const currentToken = await load(StorageKeys.accessToken);
  if (currentToken !== sentToken) return;

  isHandlingExpiry = true;
  try {
    await onSessionExpired();
  } finally {
    isHandlingExpiry = false;
  }
}

const tokenFrom = (config) => {
  const header = config?.headers?.Authorization;
  return typeof header === 'string' ? header.replace(/^Bearer /, '') : null;
};

// ── Outgoing bodies ─────────────────────────────────────────────────────────
/**
 * Trim every string in a request body, once, for every call.
 *
 * Screens trim too, because validation needs the trimmed value — but relying
 * on that alone means the next form someone writes sends " AGT-ORG-123 " and
 * gets a "does not match" from the server that nobody can explain. Doing it
 * here makes it impossible to forget.
 *
 * `password` is excluded: leading or trailing spaces can be a real part of a
 * password, and silently altering one turns a correct password into a failed
 * login. OTP and activation codes need no exception — OtpInput only emits
 * digits.
 */
const NEVER_TRIM = new Set(['password']);

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;

function trimDeep(value, key) {
  if (typeof value === 'string') return NEVER_TRIM.has(key) ? value : value.trim();
  if (Array.isArray(value)) return value.map((item) => trimDeep(item));
  // Anything exotic (FormData, Blob, URLSearchParams) is passed through as-is.
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([nestedKey, nested]) => [nestedKey, trimDeep(nested, nestedKey)]),
    );
  }
  return value;
}

// ── Logging ─────────────────────────────────────────────────────────────────
// Every call is printed with its address, payload and response, which is what
// makes a backend problem diagnosable from a phone. Credentials are stripped
// first: device logs are readable by other apps on a rooted phone and get
// attached to crash reports, so a password must never reach one. Everything
// else is printed in full, so a payload can be checked against the API docs.
const SECRET_FIELDS = new Set(['password', 'accessToken', 'refreshToken', 'token', 'authorization']);

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        SECRET_FIELDS.has(key) ? '[redacted]' : redact(nested),
      ]),
    );
  }
  return value;
}

/** Outgoing bodies are a JSON string by this point; incoming ones are objects. */
function asData(body) {
  if (body === undefined || body === null) return null;
  if (typeof body !== 'string') return redact(body);
  try {
    return redact(JSON.parse(body));
  } catch {
    return body;
  }
}

function logApi(marker, entry) {
  if (!LOG_API) return;
  console.log(`[API ${marker}]`, JSON.stringify(entry, null, 2));
}

const addressOf = (config) => `${config?.baseURL ?? ''}${config?.url ?? ''}`;
const elapsed = (config) => `${Date.now() - (config?.metadata?.startedAt ?? Date.now())}ms`;

// ── Clients ─────────────────────────────────────────────────────────────────
function createClient({ authenticated }) {
  const client = create({
    baseURL: BASE_URL,
    timeout: REQUEST_TIMEOUT_MS,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use(async (config) => {
    if (authenticated) {
      const token = await load(StorageKeys.accessToken);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    // Trimmed before logging, so the log shows exactly what went on the wire.
    if (config.data !== undefined) config.data = trimDeep(config.data);

    config.metadata = { startedAt: Date.now() };
    logApi('request', {
      apiAddress: addressOf(config),
      method: config.method?.toUpperCase(),
      authenticated,
      apiPayload: asData(config.data),
    });

    return config;
  });

  client.interceptors.response.use(
    (response) => {
      logApi('response', {
        apiAddress: addressOf(response.config),
        method: response.config?.method?.toUpperCase(),
        status: response.status,
        duration: elapsed(response.config),
        apiPayload: asData(response.config?.data),
        apiResponse: asData(response.data),
      });
      return response;
    },
    async (error) => {
      logApi('failed', {
        apiAddress: addressOf(error.config),
        method: error.config?.method?.toUpperCase(),
        status: error.response?.status ?? 'no response (network / timeout)',
        duration: elapsed(error.config),
        apiPayload: asData(error.config?.data),
        apiResponse: asData(error.response?.data) ?? error.message,
      });
      // `skipSessionExpiry` is for the startup token check: it EXPECTS a 401
      // to be possible, handles it itself, and must not make the user read a
      // "session expired" toast for something they didn't do.
      if (
        authenticated &&
        error.response?.status === 401 &&
        !error.config?.skipSessionExpiry
      ) {
        await handleUnauthorized(tokenFrom(error.config));
      }
      return Promise.reject(error);
    },
  );

  return client;
}

export const publicApi = createClient({ authenticated: false });
export const api = createClient({ authenticated: true });

// ── Responses ───────────────────────────────────────────────────────────────

/** An error whose `message` is safe to show the user as-is. */
export class ApiError extends Error {
  constructor(message, { code = null, status = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

/** Turn anything thrown by axios into an ApiError with a readable message. */
export function toApiError(error) {
  if (error instanceof ApiError) return error;

  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return new ApiError(i18n.t('common.errors.timeout'), { code: 'TIMEOUT' });
    }
    if (!error.response) {
      return new ApiError(i18n.t('common.errors.network'), { code: 'NETWORK' });
    }
    const body = error.response.data;
    return new ApiError(body?.message || i18n.t('common.errors.generic'), {
      code: body?.errorCode ?? null,
      status: error.response.status,
    });
  }

  return new ApiError(error?.message || i18n.t('common.errors.generic'));
}

/**
 * Await a request and unwrap the backend envelope:
 *
 *   { success, errorCode, message, data }
 *
 * The server can answer HTTP 200 with `success: false`, so that is treated as a
 * failure too. Resolves with `data`; rejects with an ApiError.
 */
export async function send(request) {
  let response;
  try {
    response = await request;
  } catch (error) {
    throw toApiError(error);
  }

  const body = response?.data;
  if (body && body.success === false) {
    throw new ApiError(body.message || i18n.t('common.errors.generic'), {
      code: body.errorCode ?? null,
      status: response.status,
    });
  }
  return body?.data ?? body;
}

