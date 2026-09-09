import * as LocalAuthentication from 'expo-local-authentication';

/**
 * Biometric unlock. Every call is guarded: expo-local-authentication is a native
 * module, so it's absent until the dev client / build includes it, and it must
 * never take the login screen down with it.
 */

/** True only if the device has the hardware AND the user has enrolled a face/finger. */
export async function isBiometricAvailable() {
  try {
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hasHardware && isEnrolled;
  } catch {
    return false;
  }
}

/** Prompt for a face/fingerprint. Resolves true only on a real success. */
export async function authenticateWithBiometrics(promptMessage) {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      disableDeviceFallback: false,
      cancelLabel: undefined,
    });
    return result.success === true;
  } catch {
    return false;
  }
}
