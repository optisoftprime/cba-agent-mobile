import { router, usePathname, useSegments } from 'expo-router';
import Toast from 'react-native-toast-message';

import i18n from '@/i18n';

/**
 * Navigation helpers, mirroring the pattern used across the Rize Spring app so
 * both codebases behave the same way: every push goes through `navigateTo`,
 * every back through `navigateBack`, and errors surface as a toast instead of
 * a redbox.
 */

// ── Double-tap push guard ────────────────────────────────────────────────────
// navigateTo() is router.push, so tapping a button twice pushes the SAME screen
// onto the stack twice. We ignore a repeat push to the same destination fired
// within this window. A back/replace clears the guard so an intentional
// re-visit right after still works.
const NAV_DEBOUNCE_MS = 700;
let lastPush = { path: null, at: 0 };

const pathKey = (path) => (typeof path === 'string' ? path : (path?.pathname ?? ''));

export function navigateTo(path, params = {}) {
  try {
    const key = pathKey(path);
    const now = Date.now();
    if (key && key === lastPush.path && now - lastPush.at < NAV_DEBOUNCE_MS) {
      // Duplicate rapid tap on the same destination — swallow it.
      return;
    }
    lastPush = { path: key, at: now };

    if (params && Object.keys(params).length > 0) {
      router.push({ pathname: path, params });
    } else {
      router.push(path);
    }
  } catch (error) {
    Toast.show({ type: 'error', text1: i18n.t('common.navigationError'), text2: error?.message });
  }
}

export function navigateBack(fallback = '/(tabs)') {
  // Leaving a screen resets the guard so re-pushing it afterwards isn't blocked.
  lastPush = { path: null, at: 0 };
  try {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback);
    }
  } catch (error) {
    Toast.show({ type: 'error', text1: i18n.t('common.navigationError'), text2: error?.message });
    router.replace(fallback);
  }
}

export function navigateReplace(path, params = {}) {
  // Replacing the current screen also clears the push guard.
  lastPush = { path: null, at: 0 };
  try {
    if (params && Object.keys(params).length > 0) {
      router.replace({ pathname: path, params });
    } else {
      router.replace(path);
    }
  } catch (error) {
    Toast.show({ type: 'error', text1: i18n.t('common.navigationError'), text2: error?.message });
  }
}

/** Current full pathname, e.g. "/customers". Component-only. */
export function useCurrentRoute() {
  return usePathname();
}

/** Current route segments, e.g. ["(tabs)", "customers"]. Component-only. */
export function useCurrentSegments() {
  return useSegments();
}
