import { load, remove, save, StorageKeys } from '@/lib/storage';

/**
 * The signed-in agent's session — the one place it is read from or written to.
 *
 *   const user = await getUser();
 *   user.fullName, user.agentCode, user.accessToken, user.deviceActivationRequired, …
 *
 * `getUser()` returns everything the login response carried, plus `expiresAt`,
 * or null when nobody is signed in.
 *
 * Stored as three secure records rather than one blob:
 *   accessToken  — its own key, because the request interceptor reads it on
 *                  every single call and shouldn't parse the whole session
 *   refreshToken — its own key, so it is never handed out by accident
 *   user         — the agent's details
 * getUser() stitches them back together, so nothing is duplicated on disk.
 *
 * All of it is SecureStore (Keychain / Keystore) and survives the app being
 * killed — see src/lib/storage.js.
 */

/** Fields the profile endpoint names differently from the login response. */
const PROFILE_FIELD_MAP = {
  phone: 'phoneNumber',
  branch: 'branchName',
};

/** Drop undefined/null so a sparse update can't blank out a good value. */
function compact(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value != null));
}

/**
 * `expiresIn` is documented as an int64 and read as SECONDS, the OAuth
 * convention. It is recorded for display and diagnostics only — whether the
 * token still works is decided by the server (see fetchAgentProfile), never by
 * this clock, which can be wrong on the device.
 */
function expiresAtFrom(expiresIn) {
  const seconds = Number(expiresIn);
  return Number.isFinite(seconds) && seconds > 0 ? Date.now() + seconds * 1000 : null;
}

/** Persist a login response. Resolves with the session, as getUser() returns it. */
export async function saveSession(loginData) {
  const { accessToken, refreshToken, ...details } = loginData ?? {};

  if (!accessToken) {
    throw new Error('[session] login response had no accessToken');
  }

  await Promise.all([
    save(StorageKeys.accessToken, accessToken),
    refreshToken
      ? save(StorageKeys.refreshToken, refreshToken)
      : remove(StorageKeys.refreshToken),
    save(StorageKeys.user, { ...details, expiresAt: expiresAtFrom(details.expiresIn) }),
  ]);

  return getUser();
}

/** The signed-in agent, or null. Token fields included. */
export async function getUser() {
  const [accessToken, refreshToken, details] = await Promise.all([
    load(StorageKeys.accessToken),
    load(StorageKeys.refreshToken),
    load(StorageKeys.user),
  ]);

  if (!accessToken || !details) return null;
  return { ...details, accessToken, refreshToken: refreshToken ?? null };
}

/** Just the token, for callers that only need to know whether one exists. */
export function getAccessToken() {
  return load(StorageKeys.accessToken);
}

/**
 * Merge fields into the stored agent details. Tokens are ignored here — they
 * are only ever written by saveSession, so a stray field can't replace one.
 */
export async function updateUser(fields) {
  const details = await load(StorageKeys.user);
  if (!details) return null;

  const { accessToken: _token, refreshToken: _refresh, ...safe } = fields ?? {};
  await save(StorageKeys.user, { ...details, ...compact(safe) });
  return getUser();
}

/** Fold a GET /agent/profile response into the session, under login's names. */
export function applyProfile(profile) {
  const mapped = Object.fromEntries(
    Object.entries(profile ?? {}).map(([key, value]) => [PROFILE_FIELD_MAP[key] ?? key, value]),
  );
  return updateUser(mapped);
}

/** Sign out. Leaves preferences (theme, language, the greeting name) alone. */
export function clearSession() {
  return remove(StorageKeys.accessToken, StorageKeys.refreshToken, StorageKeys.user);
}
