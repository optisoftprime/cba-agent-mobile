import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BrandLogo } from '@/components/ui/brand-logo';
import { Button } from '@/components/ui/button';
import { bootstrapApp } from '@/lib/bootstrap';
import { navigateReplace } from '@/lib/navigate';
import { useAuth } from '@/providers/auth-provider';
import { useTheme } from '@/theme/theme-provider';

/**
 * Splash — the first screen, and the only place required app data is loaded.
 * Holds until the session is restored and bootstrapApp() resolves, then routes
 * on. If loading fails the user gets a retry rather than an empty app.
 */
export default function SplashScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isLoading: isRestoringSession, isAuthenticated } = useAuth();

  const [isReady, setIsReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setFailed(false);
      try {
        await bootstrapApp();
        if (!cancelled) setIsReady(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(() => {
    if (!isReady || isRestoringSession) return;
    navigateReplace(isAuthenticated ? '/(tabs)' : '/(auth)/login');
  }, [isReady, isRestoringSession, isAuthenticated]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return (
    <View className="flex-1 items-center justify-center bg-primary px-8">
      <BrandLogo />

      {failed ? (
        <View className="mt-10 w-full items-center gap-5">
          <Text className="text-center text-[15px] leading-6 text-on-primary/85">
            {t('auth.splash.failed')}
          </Text>
          <Button label={t('auth.splash.retry')} variant="secondary" onPress={retry} />
        </View>
      ) : (
        <View className="absolute bottom-24 items-center gap-3">
          <ActivityIndicator color={colors.onPrimary} />
          <Text className="text-[13px] text-on-primary/80">{t('auth.splash.loading')}</Text>
        </View>
      )}
    </View>
  );
}
