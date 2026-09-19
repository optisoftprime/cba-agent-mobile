/**
 * Where a deposit was captured.
 *
 * The backend takes `latitude`/`longitude` on a deposit as optional fraud
 * context. So this is BEST EFFORT and never blocks: if permission is refused,
 * the hardware is off, or the fix takes too long, the deposit still posts —
 * without coordinates. Failing to post a real customer's cash because a GPS
 * read timed out would be far worse than posting it unstamped.
 *
 * Every entry point is guarded the same way `lib/device.js` guards its native
 * modules: a dev client built before expo-location was added must still run.
 */

// Literal path on purpose: Metro only bundles `require('...')` with a string
// literal, so a shared require helper would never find the module.
function loadLocation() {
  try {
    return require('expo-location');
  } catch {
    return null;
  }
}

/** Long enough for a warm fix, short enough not to stall a queue of customers. */
const FIX_TIMEOUT_MS = 6000;

/**
 * Resolves `{ latitude, longitude }`, or `null` when unavailable for any
 * reason. Never rejects and never throws.
 */
export async function getCaptureLocation() {
  const Location = loadLocation();
  if (!Location) return null;

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise((resolve) => setTimeout(() => resolve(null), FIX_TIMEOUT_MS)),
    ]);

    const latitude = position?.coords?.latitude;
    const longitude = position?.coords?.longitude;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    return { latitude, longitude };
  } catch {
    return null;
  }
}
