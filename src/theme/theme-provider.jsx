import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, View } from 'react-native';
import { vars } from 'nativewind';

import { brand, hexToRgbChannels, palette, shadows, toKebab, toShadowStyle } from '@/theme/brand';
import { load, save, StorageKeys } from '@/lib/storage';

/**
 * Owns the active palette and publishes it three ways:
 *   1. as CSS variables on a root <View>, so every `bg-*`/`text-*`/`border-*`
 *      class in the app resolves to the current theme automatically;
 *   2. as raw hex through `useTheme().colors`, for the handful of props that
 *      take a real colour (Ionicons `color`, StatusBar, navigator options);
 *   3. as `useTheme().shadows` — ready-made RN shadow styles for the active
 *      theme, since elevation can't be expressed as a CSS variable.
 *
 * Components should reach for the Tailwind class first and only use `colors`
 * when a className isn't possible — that's the thing that keeps re-branding to
 * a single file.
 *
 * Caveat: the variables travel down the React tree, so anything rendered into a
 * separate host tree (a bare RN <Modal>) loses them. Wrap that content in its
 * own <View style={useThemeVars()}> — or just use a themed component inside it.
 */

const ThemeContext = createContext(undefined);

// 'light' | 'dark' | 'system'
const MODES = ['light', 'dark', 'system'];

/** Turn a palette into the `--color-*` variables Tailwind reads. */
function paletteToVars(colors) {
  return vars(
    Object.fromEntries(
      Object.entries(colors).map(([token, hex]) => [
        `--color-${toKebab(token)}`,
        hexToRgbChannels(hex),
      ]),
    ),
  );
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(brand.defaultThemeMode);
  const [systemScheme, setSystemScheme] = useState(
    () => Appearance.getColorScheme() ?? 'light',
  );
  // Optional per-session palette override (partial or full) — e.g. a branded
  // takeover, or a palette pushed down from the backend for a white-label
  // deployment. Cleared with clearOverride().
  const [override, setOverride] = useState(null);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme ?? 'light');
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    (async () => {
      const saved = await load(StorageKeys.themeMode);
      if (saved && MODES.includes(saved)) setModeState(saved);
    })();
  }, []);

  const scheme = mode === 'system' ? systemScheme : mode;
  const isDark = scheme === 'dark';

  const colors = useMemo(
    () => ({ ...(isDark ? palette.dark : palette.light), ...override }),
    [isDark, override],
  );

  const themeVars = useMemo(() => paletteToVars(colors), [colors]);

  // Ready-made RN shadow styles for the active theme: style={shadows.md}
  const themeShadows = useMemo(() => {
    const spec = isDark ? shadows.dark : shadows.light;
    return Object.fromEntries(
      Object.entries(spec).map(([level, value]) => [level, toShadowStyle(value)]),
    );
  }, [isDark]);

  const setMode = useCallback(async (next) => {
    if (!MODES.includes(next)) return;
    setModeState(next);
    await save(StorageKeys.themeMode, next);
  }, []);

  const toggleTheme = useCallback(() => setMode(isDark ? 'light' : 'dark'), [isDark, setMode]);

  const value = useMemo(
    () => ({
      colors,
      shadows: themeShadows,
      isDark,
      scheme,
      mode,
      setMode,
      toggleTheme,
      applyOverride: setOverride,
      clearOverride: () => setOverride(null),
    }),
    [colors, themeShadows, isDark, scheme, mode, setMode, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={[themeVars, { flex: 1 }]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}
