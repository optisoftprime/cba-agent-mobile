import { Stack } from 'expo-router';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import '@/global.css';
import { AppProviders } from '@/providers/app-providers';
import { useTheme } from '@/theme/theme-provider';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hand straight over to our own splash screen (src/app/index.jsx), which
    // owns the real loading — see src/lib/bootstrap.js.
    SplashScreen.hideAsync();
  }, []);

  // Android puts the navigation bar back after certain system interactions
  // (a swipe from the edge, returning from the recents switcher, a permission
  // dialog). The declarative component below covers the normal case; this
  // re-asserts it whenever the app comes back to the foreground, so the agent
  // doesn't drift back to a windowed-looking app after a few minutes of use.
  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;

    const hide = () => NavigationBar.setHidden(true);
    hide();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') hide();
    });
    return () => subscription.remove();
  }, []);

  return (
    <AppProviders>
      {/* The status bar STAYS: an agent out on a round needs the time, the
          battery and the signal at a glance, and hiding it meant swiping down
          to check any of them. Only the bottom navigation bar goes — that one
          is dead space the app can use. `style="light"` because the banner
          behind it is the brand colour. */}
      <StatusBar style="light" />
      <NavigationBar hidden />

      <RootStack />
    </AppProviders>
  );
}

/**
 * React Navigation's own screen background is WHITE by default, whatever the
 * app's theme — so a push in dark mode flashes white behind the incoming
 * screen. `contentStyle` puts the theme's colour there instead. Separate
 * component because `useTheme()` only works inside AppProviders.
 */
function RootStack() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}

export const unstable_settings = {
  initialRouteName: 'index',
};
