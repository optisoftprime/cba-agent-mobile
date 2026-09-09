import { initAppLanguage } from '@/i18n';

/**
 * Everything the app cannot run without, loaded behind the splash screen.
 *
 * Add required preloads here — remote config, reference data, fonts — and the
 * splash will hold until they resolve and show a retry if they don't. Anything
 * a screen can live without belongs in that screen's own query instead, so a
 * slow endpoint can't block the whole app from opening.
 */
export async function bootstrapApp() {
  await Promise.all([
    // Saved / device language. Strings already render before this (i18n is
    // initialised on import with the brand default); this swaps to the choice.
    initAppLanguage(),
    // TODO: required app data, e.g. queryClient.prefetchQuery(configQuery)
  ]);
}
