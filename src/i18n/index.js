/* eslint-disable import/no-named-as-default-member -- the whole i18next API is used via its default export */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { brand } from '@/theme/brand';
import { StorageKeys, storage } from '@/lib/storage';

/**
 * i18next setup.
 *
 * Translations live in src/i18n/locales/<lang>/<namespace>.json and are
 * DISCOVERED AUTOMATICALLY — there is no import list to keep in lock-step.
 *
 *   Adding a namespace  → drop en/<name>.json (and one per other language) in.
 *   Adding a language   → copy the whole en/ folder, translate, done. It shows
 *                         up in LANGUAGES and the picker on its own.
 *
 * Namespaces are merged into one flat `translation` namespace, so keys stay
 * t('dashboard.tasks.title') with no `namespace:` prefix.
 *
 * `npm run check:locales` fails if a key exists in one language but not another.
 */

// Metro resolves this at build time; expo-router uses the same mechanism.
const context = require.context('./locales', true, /\.json$/);

const resources = {};

for (const key of context.keys()) {
  // Normally './en/dashboard.json'. Parsed by taking the last two segments
  // rather than matching the whole string, so a bundler that hands back a
  // differently-prefixed key still resolves to the right language/namespace —
  // a mis-parse here would leave every screen showing raw keys.
  const segments = key.replace(/\.json$/, '').split('/').filter(Boolean);
  if (segments.length < 2) continue;
  const namespace = segments[segments.length - 1];
  const language = segments[segments.length - 2];
  if (language === '.' || language === '..') continue;

  resources[language] ??= { translation: {} };
  resources[language].translation[namespace] = context(key);
}

// Fail loudly in development rather than shipping a UI full of raw key paths.
if (__DEV__ && Object.keys(resources).length === 0) {
  throw new Error(
    '[i18n] No translations were discovered under src/i18n/locales. ' +
      'Every screen would render raw keys — check the require.context glob.',
  );
}

/** Human labels for the picker. Add a folder above and one line here. */
const LANGUAGE_LABELS = {
  en: 'English',
  fr: 'Français',
};

/** Every shipped language, derived from the folders that actually exist. */
export const LANGUAGES = Object.keys(resources)
  .sort()
  .map((code) => ({ code, label: LANGUAGE_LABELS[code] ?? code.toUpperCase() }));

// Init synchronously, at import time, so the very first render already has
// strings; the saved / device language is resolved right after by
// initAppLanguage(). Guarded because a module can be evaluated more than once
// across Fast Refresh.
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: brand.defaultLanguage,
    fallbackLng: brand.defaultLanguage,
    interpolation: { escapeValue: false }, // React already escapes
    returnNull: false,
    react: { useSuspense: false }, // translations are bundled and synchronous
    // Surfaces a typo'd or unwired key during development instead of letting it
    // reach the UI as `namespace.some.key`.
    saveMissing: __DEV__,
    missingKeyHandler: (languages, namespace, key) => {
      if (__DEV__) console.warn(`[i18n] missing translation for "${key}"`);
    },
  });
}

// Prove the wiring end to end at startup: if this key comes back as itself,
// t() is echoing keys and every screen is about to render `namespace.some.key`.
if (__DEV__) {
  const probe = i18n.t('common.signOut');
  if (probe === 'common.signOut') {
    console.error(
      '[i18n] Translations are NOT resolving — screens will show raw keys. ' +
        `isInitialized=${i18n.isInitialized}, languages=${Object.keys(resources).join()}`,
    );
  }
}

/** Best initial language: saved choice → device locale → brand default. */
export async function initAppLanguage() {
  try {
    const saved = await storage.get(StorageKeys.language);
    if (saved && resources[saved]) {
      if (i18n.language !== saved) await i18n.changeLanguage(saved);
      return;
    }

    // Guarded: expo-localization is a native module, so it only exists once the
    // dev client / build includes it. Falls back to the brand default.
    let device = brand.defaultLanguage;
    try {
      const Localization = require('expo-localization');
      const code = Localization.getLocales?.()?.[0]?.languageCode;
      if (code && resources[code]) device = code;
    } catch {
      // native module not present yet — stay on the default
    }
    if (i18n.language !== device) await i18n.changeLanguage(device);
  } catch {
    // any failure → stay on the synchronous default
  }
}

/** Change + persist the language. The picker calls this. */
export async function setAppLanguage(code) {
  if (!resources[code]) return;
  await i18n.changeLanguage(code);
  await storage.set(StorageKeys.language, code);
}

export default i18n;
