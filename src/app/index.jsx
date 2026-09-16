import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BrandLogo } from '@/components/ui/brand-logo';
import { Button } from '@/components/ui/button';
import { getPendingActivation } from '@/lib/activation';
import { bootstrapApp } from '@/lib/bootstrap';
import { navigateReplace } from '@/lib/navigate';
import { getUser } from '@/lib/session';
import { SessionStatus, useAuth } from '@/providers/auth-provider';
import { useTheme } from '@/theme/theme-provider';

/**
 * Splash — the first screen, and the only place startup work happens. It does
 * the waiting and then gets out of the way; it never asks the agent for
 * anything.
 *
 *   activation half-finished    → back to the OTP screen, where they left off
 *   device needs activating     → the activation flow
 *   anything else               → login
 *
 * A token that turns out to belong to a different agent is treated as no
 * session at all — see verifySession.
 *
 * A valid session goes to login too, on purpose: that screen greets the agent
 * by name and offers the fingerprint. Unlocking is a decision, and decisions
 * belong on a screen the agent can act on, not on a splash that flashes past.
 *
 * The session is still checked here so login knows whether there is one, and
 * so the agent's details are refreshed before anything renders them. "Still
 * valid" is answered by the server, never by a clock on the device. If the
 * server can't be reached the session is kept and the app opens anyway.
 */

export default function SplashScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { verifySession } = useAuth();

  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;

    (async () => {
      try {
        setFailed(false);
        await bootstrapApp();
        if (cancelled.current) return;

        // A half-finished activation outranks everything: it must be finished
        // or abandoned before the app is usable.
        if (await getPendingActivation()) {
          if (!cancelled.current) navigateReplace('/(auth)/verify-otp');
          return;
        }

        const status = await verifySession();
        if (cancelled.current) return;

        if (status === SessionStatus.valid || status === SessionStatus.unverified) {
          const session = await getUser();
          if (cancelled.current) return;

          if (session?.deviceActivationRequired) {
            navigateReplace('/(auth)/activate-device');
            return;
          }
        }

        navigateReplace('/(auth)/login');
      } catch {
        if (!cancelled.current) setFailed(true);
      }
    })();

    return () => {
      cancelled.current = true;
    };
  }, [attempt, verifySession]);

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
