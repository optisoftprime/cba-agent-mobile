import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * ONE way to persist anything:
 *
 *   await save(StorageKeys.user, user);
 *   const user = await load(StorageKeys.user);
 *   await remove(StorageKeys.accessToken, StorageKeys.user);
 *
 * Where a value lives is decided ONCE, per key, below — never at the call site.
 * A call site can't put a token in AsyncStorage by picking the wrong helper,
 * because there is no helper to pick.
 *
 *   secure — Keychain (iOS) / Keystore-backed (Android). Tokens, the signed-in
 *            user, the device id the bank binds to, a half-finished activation.
 *   plain  — AsyncStorage. Harmless preferences: theme, language.
 *
 * Both survive the app being killed — which in-memory state doesn't.
 *
 * Values of any JSON type round-trip (strings, numbers, booleans, objects).
 * Nothing here throws: `save` resolves false on failure and `load` resolves
 * null, so a storage hiccup degrades one feature instead of crashing a screen.
 */

const secure = (name) => ({ name, secure: true });
const plain = (name) => ({ name, secure: false });

/** Every persisted value. SecureStore names allow only letters, digits, . - _ */
export const StorageKeys = {
  accessToken: secure('cba.accessToken'),
  refreshToken: secure('cba.refreshToken'),
  user: secure('cba.user'),
  deviceId: secure('cba.deviceId'),
  pendingActivation: secure('cba.pendingActivation'),

  themeMode: plain('cba.themeMode'),
  language: plain('cba.language'),
  /** Set once the first-launch theme/language choice has been made. */
  preferencesChosen: plain('cba.preferencesChosen'),
  deviceActivated: plain('cba.deviceActivated'),
};

// SecureStore doesn't exist on web; fall back so the web build still runs.
const inSecureStore = (key) => key.secure && Platform.OS !== 'web';

function assertKey(key) {
  if (!key?.name) {
    throw new Error('[storage] Use a key from StorageKeys, e.g. save(StorageKeys.user, user).');
  }
}

export async function save(key, value) {
  assertKey(key);
  const raw = JSON.stringify(value);
  try {
    if (inSecureStore(key)) await SecureStore.setItemAsync(key.name, raw);
    else await AsyncStorage.setItem(key.name, raw);
    return true;
  } catch (error) {
    if (__DEV__) console.warn(`[storage] save ${key.name} failed:`, error?.message);
    return false;
  }
}

export async function load(key) {
  assertKey(key);
  let raw;
  try {
    raw = inSecureStore(key)
      ? await SecureStore.getItemAsync(key.name)
      : await AsyncStorage.getItem(key.name);
  } catch {
    return null;
  }
  if (raw === null || raw === undefined) return null;

  try {
    return JSON.parse(raw);
  } catch {
    // Written before values were JSON-encoded — a bare string. Hand it back
    // as-is rather than losing it.
    return raw;
  }
}

/** Remove one or more keys: remove(StorageKeys.accessToken, StorageKeys.user). */
export async function remove(...keys) {
  await Promise.all(
    keys.map(async (key) => {
      assertKey(key);
      try {
        if (inSecureStore(key)) await SecureStore.deleteItemAsync(key.name);
        else await AsyncStorage.removeItem(key.name);
      } catch {
        // already gone
      }
    }),
  );
}
