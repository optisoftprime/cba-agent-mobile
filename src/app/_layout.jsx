import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import '@/global.css';
import { AppProviders } from '@/providers/app-providers';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hand straight over to our own splash screen (src/app/index.jsx), which
    // owns the real loading — see src/lib/bootstrap.js.
    SplashScreen.hideAsync();
  }, []);

  return (
    <AppProviders>
      {/* The header banner is always the brand colour, so light content reads. */}
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}

export const unstable_settings = {
  initialRouteName: 'index',
};
