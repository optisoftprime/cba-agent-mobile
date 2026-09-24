import { create, isAxiosError } from 'axios';

import { endpoints } from '@/api/endpoints';
import { BASE_URL, LOG_API, REQUEST_TIMEOUT_MS } from '@/config/backend';
import i18n from '@/i18n';
import { getDeviceId } from '@/lib/device';
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
async function handleUnauthorized(sentToken, reason = null) {
  if (isHandlingExpiry || !onSessionExpired || !sentToken) return;

  const currentToken = await load(StorageKeys.accessToken);
  if (currentToken !== sentToken) return;

  isHandlingExpiry = true;
  try {
    await onSessionExpired(reason);
  } finally {
    isHandlingExpiry = false;
  }
}

let onPermissionDenied = null;

/** The UI registers how to say "you cannot do this" — see PermissionProvider. */
export function setPermissionDeniedHandler(handler) {
  onPermissionDenied = handler;
}

/**
 * Is this 401 the server saying "not allowed", rather than "not signed in"?
 *
 * The backend returns **401 for a permission refusal** as well as for a dead
 * token, which collides badly: one must sign the agent out, the other must
 * not. A permission refusal is not an authentication failure and should be a
 * 403 — raised with the backend team.
 *
 * Until it moves, they are told apart by the message. This defaults to SIGNING
 * OUT: an unrecognised 401 is treated as a dead token, because leaving an
 * agent inside the app on a token the server rejects means every screen fails
 * with no way out. Being signed out unnecessarily is recoverable; the reverse
 * is not.
 *
 * In normal use this should never fire — `PermissionProvider` knows the
 * agent's permissions up front and stops the call being made at all. This
 * catches the case where an administrator changes a permission mid-session.
 */
const PERMISSION_REFUSAL = /permission|not allowed|not permitted|forbidden|unauthoriz(ed|ation) to|no access to/i;

function isPermissionRefusal(status, body) {
  if (status !== 401) return false;
  const message = String(body?.message ?? '');
  if (!message) return false;
  // "Invalid access token: <uuid>" and friends are dead tokens, not refusals.
  if (/token|expired|sign in|log ?in|credential/i.test(message)) return false;
  return PERMISSION_REFUSAL.test(message);
}

/**
 * Both 401 and 403 end the session.
 *
 * 401 is the token being rejected. 403 is the SERVER refusing this agent —
 * observed on the live server as a suspended account ("Your agent access is
 * suspended", returned by every endpoint) and as an unregistered handset
 * ("This device is not the one registered to your account"). Neither is
 * something the agent can do anything about from inside the app, and leaving
 * them in it means every screen errors while the session looks fine. That is
 * exactly what QA hit.
 *
 * Signing out costs nothing in either case, because the way back in is through
 * the login screen anyway:
 *   suspended  -> login itself returns 403, so they cannot get back in, which
 *                 is correct.
 *   device     -> login succeeds and returns `deviceActivationRequired`, which
 *                 routes them to Activate Device. Activation runs on
 *                 `publicApi` and needs NO token, so having signed out does not
 *                 block it.
 *
 * This deliberately does no message matching. An earlier version tried to tell
 * a revoked account from a device rejection by reading the message, because
 * `errorCode` is a bare `ERR_403` for both — brittle, and unnecessary once the
 * answer is the same either way.
 */
function endsSession(status) {
  return status === 401 || status === 403;
}

/**
 * A money action refused with 401/403 — was it the ACTION or the SESSION?
 *
 * Finman refuses a deposit for reasons that have nothing to do with being
 * signed in (a reconciliation hold, not enough cash, a cap), and it uses 401
 * freely for refusals. ezone-agent-service relays and rewords those, so the
 * status that reaches the app cannot be relied on to tell the two apart — and
 * signing an agent out because a deposit was refused under a hold would lock
 * them out of the very remittance and end of day that lift the hold.
 *
 * So instead of guessing from the status or the message, ask the server: one
 * quiet profile call on the same token. It answers → the session is fine and
 * only the action was refused (the screen shows the server's message). It is
 * refused too → the session really is over. It cannot be reached → keep the
 * session; unreachable is not signed out.
 *
 * Opt in per call with `{ confirmSession: true }` — see deposits, remittances
 * and the EOD submit.
 *
 * @returns {Promise<{ ended: boolean, reason?: string | null }>}
 */
async function confirmSessionAfterRefusal(client) {
  try {
    await client.get(endpoints.agent.profile, { skipSessionExpiry: true });
    return { ended: false };
  } catch (probeError) {
    const probeStatus = probeError.response?.status;
    if (!endsSession(probeStatus)) return { ended: false };
    return {
      ended: true,
      reason: probeStatus === 403 ? (probeError.response?.data?.message ?? null) : null,
    };
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

      // Core banking binds an agent to ONE handset and compares this against
      // the device registered at activation. The deposit endpoint declares it
      // required, and the server's own refusal says "Send your device id with
      // every request", so it rides on every authenticated call rather than
      // being remembered at each new call site. Without it: 403 "Send your
      // device id with every request"; with a different one: 403 "This device
      // is not the one registered to your account". Neither is a 401, so
      // neither ends the session — which is right, because a wrong handset is
      // not an expired token.
      //
      // `getDeviceId()`, NOT a bare storage read: the id used to be saved only
      // during activation, so a reinstalled app (Android wipes SecureStore on
      // uninstall) on a handset the bank still has bound sent NO header, and
      // every deposit came back "Send your device id with every request".
      // getDeviceId() re-derives the same Android ID activation sent.
      const deviceId = await getDeviceId();
      if (deviceId) config.headers['X-Agent-Device-Id'] = deviceId;
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
      const status = error.response?.status;
      const body = error.response?.data;

      // Never treat a refusal FROM the permissions endpoint as a permission
      // refusal: the handler re-fetches permissions, which would refuse again —
      // a tight request loop behind a modal the agent cannot dismiss.
      const isPermissionsCall = error.config?.url === endpoints.agent.permissions;
      const deniedPermission = authenticated && !isPermissionsCall && isPermissionRefusal(status, body);

      // A money call asks the SERVER first, before anything is read into the
      // message. Ordering matters: finman words a hold as "Deposits are not
      // allowed while…", which the refusal pattern matches — so checking the
      // message first would answer a reconciliation hold with "speak to your
      // administrator" and hide the real reason. Once the probe says the
      // session is alive, a refusal that really is about permissions still
      // opens the modal.
      if (authenticated && endsSession(status) && error.config?.confirmSession) {
        const { ended, reason } = await confirmSessionAfterRefusal(client);
        if (ended) await handleUnauthorized(tokenFrom(error.config), reason);
        else if (deniedPermission) onPermissionDenied?.(body?.message ?? null);
        return Promise.reject(error);
      }

      // A permission refusal is NOT a dead session — the agent stays signed in
      // and is told what they cannot do.
      if (deniedPermission) {
        onPermissionDenied?.(body?.message ?? null);
        return Promise.reject(error);
      }

      if (authenticated && endsSession(status) && !error.config?.skipSessionExpiry) {
        // Hand the server's own words through when it gave a reason: "Your
        // agent access is suspended" tells the agent what happened and who to
        // ask; a generic "session expired" would send them to retype a
        // password that is also going to be refused.
        await handleUnauthorized(
          tokenFrom(error.config),
          status === 403 ? body?.message : null,
        );
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

