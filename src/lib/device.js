import { Platform } from 'react-native';

import { load, save, StorageKeys } from '@/lib/storage';

/**
 * What the backend needs to bind this phone to an agent:
 *   { deviceId, deviceName, platform, appVersion }
 *
 * The native modules are required lazily and every read is guarded: a dev
 * client built before these modules were added must still open the app, just
 * with fallback values, rather than crash on import.
 */

// Literal paths on purpose: Metro only bundles `require('...')` with a string
// literal, so a shared `require(name)` helper would never find the module.
function loadApplication() {
  try {
    return require('expo-application');
  } catch {
    return null;
  }
}

function loadDevice() {
  try {
    return require('expo-device');
  } catch {
    return null;
  }
}

function loadConstants() {
  try {
    return require('expo-constants').default;
  } catch {
    return null;
  }
}

/** RFC 4122 v4 shape. Only used if the platform gives us no stable id. */
function randomId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });
}

async function platformId() {
  const Application = loadApplication();
  if (!Application) return null;

  try {
    if (Platform.OS === 'android') return Application.getAndroidId() || null;
    // Can be null straight after a reboot, before the phone is first unlocked.
    if (Platform.OS === 'ios') return (await Application.getIosIdForVendorAsync()) || null;
  } catch {
    // fall through to the random id
  }
  return null;
}

/**
 * The id the bank binds this phone to. Read once, then kept in SecureStore so
 * it never changes under the backend — even on iOS, where the vendor id can
 * reset while the keychain entry survives.
 */
export async function getDeviceId() {
  const saved = await load(StorageKeys.deviceId);
  if (saved) return String(saved);

  const id = (await platformId()) ?? randomId();
  await save(StorageKeys.deviceId, id);
  return id;
}

export async function getDeviceInfo() {
  const Device = loadDevice();
  const Application = loadApplication();
  const Constants = loadConstants();

  return {
    deviceId: await getDeviceId(),
    // modelName ("Pixel 7", "iPhone 15 Pro") over deviceName: on iOS 16+
    // deviceName is a generic "iPhone" without a special entitlement.
    deviceName: Device?.modelName ?? Device?.deviceName ?? 'Unknown device',
    platform: Platform.OS,
    appVersion:
      Application?.nativeApplicationVersion ?? Constants?.expoConfig?.version ?? 'unknown',
  };
}
