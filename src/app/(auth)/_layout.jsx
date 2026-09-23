import { Stack } from 'expo-router';

import { useTheme } from '@/theme/theme-provider';

export default function AuthLayout() {
  const { colors } = useTheme();

  // See RootStack in src/app/_layout.jsx — the navigator's own background is
  // white by default, which flashes on every push in dark mode.
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    />
  );
}
