/* eslint-disable import/no-named-as-default-member -- the whole i18next API is used via its default export */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { brand } from '@/theme/brand';
import { load, save, StorageKeys } from '@/lib/storage';

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

/**
 * Read every locale file, as it is RIGHT NOW.
 *
 * Rebuilt on each call on purpose. Metro's require.context hands back the
 * module through a getter, so re-reading it after an edit returns the new
 * contents — which is what lets a changed string reach the app without
 * restarting the bundler. A snapshot taken once at module load cannot.
 */
function buildResources() {
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

  return resources;
}

const resources = buildResources();

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
/**
 * Re-read the locale files and merge them into the live instance.
 *
 * init() copies `resources` once and never looks again, so a string added
 * after startup would otherwise render as a raw `namespace.some.key` until the
 * bundler was restarted. This reads the files afresh — see buildResources.
 */
function applyResources() {
  for (const [language, bundle] of Object.entries(buildResources())) {
    // deep = merge into what's there, overwrite = newer wins.
    i18n.addResourceBundle(language, 'translation', bundle.translation, true, true);
  }
}

/**
 * A key that isn't in the store is usually one added since startup, so re-read
 * the files and re-render rather than leaving the agent looking at a key path.
 *
 * Throttled, NOT once-per-key. An earlier version gave up after one attempt,
 * which lost the race with the bundler: if the re-read happened before Metro
 * delivered the edited file, that key was written off and rendered as
 * `namespace.some.key` until the app was restarted. Retrying means it heals as
 * soon as the file actually arrives.
 */
const REPAIR_THROTTLE_MS = 400;
let lastRepairAt = 0;

function repairMissingKey(key) {
  const now = Date.now();
  if (now - lastRepairAt < REPAIR_THROTTLE_MS) return;
  lastRepairAt = now;

  console.warn(`[i18n] "${key}" was missing — re-reading the locale files`);
  applyResources();
  // react-i18next re-renders on languageChanged. Deferred because this runs
  // inside t(), which is called during render.
  setTimeout(() => i18n.emit('languageChanged', i18n.language), 0);
}

/**
 * The last line of defence: whatever happens, never render a dotted key path.
 *
 * "dashboard.activity.empty" becomes "Empty" — wrong wording, but it reads as
 * text rather than as a bug, and `npm run check:locales` catches the real
 * problem before it ships.
 */
function humanise(key) {
  const last = String(key).split('.').pop() ?? '';
  const spaced = last.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

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
      if (__DEV__) repairMissingKey(key);
    },
    // Runs in every build, so a missing key degrades to a word rather than a
    // key path — in development it is usually replaced moments later by the
    // re-read above.
    parseMissingKeyHandler: humanise,
  });
} else {
  applyResources();
  // Adding strings doesn't re-render anything on its own. react-i18next
  // listens for languageChanged, so this is what makes an edited locale file
  // show up on screen without a restart.
  if (__DEV__) i18n.emit('languageChanged', i18n.language);
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
    const saved = await load(StorageKeys.language);
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
  await save(StorageKeys.language, code);
}

export default i18n;

// Fast Refresh: re-running this module after a locale file changes is what
// pushes the new strings into the live instance. Without an explicit accept,
// the update can stop at a boundary further up and never reach here.
if (__DEV__ && typeof module !== 'undefined' && module.hot) {
  module.hot.accept(() => {
    applyResources();
    i18n.emit('languageChanged', i18n.language);
  });
}
