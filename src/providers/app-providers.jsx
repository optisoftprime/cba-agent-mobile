import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppToast } from '@/components/layout/app-toast';
import i18n from '@/i18n';
import { AuthProvider } from '@/providers/auth-provider';
import { ThemeProvider } from '@/theme/theme-provider';

export function AppProviders({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Android is edge-to-edge from Expo SDK 54, which stops the window being
          resized when the keyboard opens — so React Native's own
          KeyboardAvoidingView does nothing there and the keyboard simply covers
          whatever is being typed into. This provider feeds the replacement in
          `components/layout/keyboard-view`, which every form uses. */}
      <KeyboardProvider>
        <SafeAreaProvider>
          {/* Binding the instance explicitly means useTranslation() can never fall
            back to an uninitialised i18next and echo raw keys, whatever order
            the route modules happen to be evaluated in. */}
          <I18nextProvider i18n={i18n}>
            {/* ThemeProvider publishes the palette as CSS variables, so it has to
                sit above anything that uses a themed class. */}
            <ThemeProvider>
              <QueryClientProvider client={queryClient}>
                <AuthProvider>
                  {children}
                  <AppToast />
                </AuthProvider>
              </QueryClientProvider>
            </ThemeProvider>
          </I18nextProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
