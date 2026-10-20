/**
 * Picking an image to attach to a support ticket.
 *
 * Returns `{ uri, name, type, base64 }` — `uri` for the on-screen preview and
 * `base64` for the upload — or `null` when the agent backed out or refused
 * permission. It never throws: an agent reporting a problem should not hit a
 * second problem trying to attach the screenshot of the first.
 *
 * The ticket endpoint takes the image as a base64 `imageUrl` data URI in the
 * JSON body (not a multipart file part), so the picker is asked for `base64`
 * up front — see src/api/support.js.
 *
 * Guarded require, like `lib/device.js` and `lib/location.js`: a dev client
 * built before expo-image-picker was added must still open the screen.
 */

// Literal path on purpose: Metro only bundles `require('...')` with a string
// literal, so a shared require helper would never find the module.
function loadPicker() {
  try {
    return require('expo-image-picker');
  } catch {
    return null;
  }
}

/** Keeps an attachment small enough to upload over a field agent's connection. */
const QUALITY = 0.7;

/** Derives a filename and mime type from whatever the picker hands back. */
function toFilePart(asset) {
  if (!asset?.uri) return null;

  const fromUri = String(asset.uri).split('/').pop() || '';
  const name = asset.fileName || (fromUri.includes('.') ? fromUri : 'attachment.jpg');
  const extension = name.split('.').pop()?.toLowerCase();

  const type =
    asset.mimeType ||
    (extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg');

  return { uri: asset.uri, name, type, base64: asset.base64 ?? null };
}

/**
 * Choose from the photo library. Resolves null if cancelled.
 *
 * NO permission is requested, and that is deliberate. On Android 13+
 * `launchImageLibraryAsync` uses the SYSTEM PHOTO PICKER: the agent picks one
 * image in an OS-owned sheet and the app receives only that image, never the
 * library. Calling `requestMediaLibraryPermissionsAsync` is what drags
 * READ_MEDIA_IMAGES into the manifest — and Google Play rejects that
 * permission for an app that only needs the occasional attachment ("Use
 * alternative system pickers for photos / videos"). It cost us a review
 * cycle; do not add the request back.
 *
 * `photosPermission: false` on the expo-image-picker plugin keeps the
 * permission out of the manifest to match.
 */
export async function pickImageFromLibrary() {
  const Picker = loadPicker();
  if (!Picker) return null;

  try {
    const result = await Picker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: QUALITY,
      allowsMultipleSelection: false,
      base64: true,
    });

    if (result.canceled) return null;
    return toFilePart(result.assets?.[0]);
  } catch {
    return null;
  }
}

/**
 * Take a photo. Resolves null if cancelled or refused.
 *
 * This one DOES request a permission: there is no system picker equivalent for
 * the camera, and CAMERA is not a restricted permission the way the media ones
 * are.
 */
export async function takePhoto() {
  const Picker = loadPicker();
  if (!Picker) return null;

  try {
    const permission = await Picker.requestCameraPermissionsAsync();
    if (!permission.granted) return null;

    const result = await Picker.launchCameraAsync({ quality: QUALITY, base64: true });

    if (result.canceled) return null;
    return toFilePart(result.assets?.[0]);
  } catch {
    return null;
  }
}
