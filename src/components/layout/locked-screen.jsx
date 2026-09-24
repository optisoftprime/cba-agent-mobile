import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { usePermissions } from '@/providers/permission-provider';

/**
 * THE screen an agent sees when a feature is not theirs.
 *
 * Every gated screen renders this instead of its content, so a feature cannot
 * be reached by any route the entry points don't cover — a notification tap, a
 * deep link, a screen still on the stack when an administrator revokes access
 * mid-shift. Fading the button that leads here is the courtesy; this is the
 * enforcement.
 *
 * It re-checks by itself. The screen it replaced had pull-to-refresh, and
 * losing it here made this a dead end: an agent whose access was granted back
 * had to find another screen to refresh on before this one would open. So it
 * re-asks on focus, on pull, and on a plain button — the button because a
 * screen with nothing to scroll gives no hint that it can be pulled.
 */
export function LockedScreen({ title, subtitle, code, showBack = false }) {
  const { t } = useTranslation();
  const { refresh } = usePermissions();

  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      await refresh();
    } finally {
      setChecking(false);
    }
  }, [refresh]);

  // Coming back to this screen is itself a reason to re-ask: the agent may have
  // just been granted access on the other side of a phone call.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const feature = code ? t(`permissions.codes.${code}`, { defaultValue: '' }) : '';

  return (
    <View className="flex-1 bg-background">
      <AppHeader showBack={showBack} title={title} subtitle={subtitle} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={checking} onRefresh={check} />}>
        <EmptyState
          icon="lock-closed-outline"
          title={t('permissions.locked.title')}
          message={
            feature
              ? t('permissions.denied.messageNamed', { feature })
              : t('permissions.denied.message')
          }
        />

        <View className="items-center px-8">
          <Button
            variant="outline"
            icon="refresh-outline"
            label={t('permissions.locked.retry')}
            loading={checking}
            onPress={check}
          />
        </View>
      </ScrollView>
    </View>
  );
}
