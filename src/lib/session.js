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
    // The backend is the authority on whether this handset is registered. If it
    // says activation is NOT required, the device is activated — even when the
    // agent never ran the in-app OTP flow on this install (they logged into an
    // account whose device was already registered). Recording it here, not only
    // in completeActivation(), is what stops the login screen offering "Activate
    // device" after such an agent signs out — the flag survives logout, the
    // session does not.
    details.deviceActivationRequired === false
      ? save(StorageKeys.deviceActivated, true)
      : Promise.resolve(),
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

/**
 * Sign out. Removes EVERYTHING about the agent from this handset — tokens, the
 * stored agent, and any half-finished device activation, which is keyed by
 * agentCode and so belongs to them too. After this the login screen knows
 * nobody: no name to greet, no fingerprint offer.
 *
 * Three things deliberately SURVIVE, and none of them is about the agent:
 *
 * - `deviceId` — the handset's identity, registered with the bank at
 *   activation and compared on every deposit (`X-Agent-Device-Id`). Wiping it
 *   would make the phone mint a new one, and the bank would then refuse
 *   deposits with "This device is not the one registered to your account"
 *   until somebody re-activated the handset. Signing out is not handing the
 *   phone back.
 * - `deviceActivated` — whether THIS HANDSET has been through activation. Same
 *   reasoning: a sign-out is not a de-registration.
 * - `themeMode` and `language` — preferences of whoever holds the phone.
 */
export function clearSession() {
  return remove(
    StorageKeys.accessToken,
    StorageKeys.refreshToken,
    StorageKeys.user,
    StorageKeys.pendingActivation,
  );
}
