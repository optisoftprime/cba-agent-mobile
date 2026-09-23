import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppHeader } from '@/components/layout/app-header';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * THE screen an agent sees when a feature is not theirs.
 *
 * Every gated screen renders this instead of its content, so a feature cannot
 * be reached by any route the entry points don't cover — a notification tap, a
 * deep link, a screen still on the stack when an administrator revokes access
 * mid-shift. Fading the button that leads here is the courtesy; this is the
 * enforcement.
 *
 * It keeps the screen's own header, so the agent knows where they are and can
 * go back, and it names the permission so they know what to ask for.
 */
export function LockedScreen({ title, subtitle, code, showBack = false }) {
  const { t } = useTranslation();

  const feature = code ? t(`permissions.codes.${code}`, { defaultValue: '' }) : '';

  return (
    <View className="flex-1 bg-background">
      <AppHeader showBack={showBack} title={title} subtitle={subtitle} />

      <EmptyState
        icon="lock-closed-outline"
        title={t('permissions.locked.title')}
        message={
          feature
            ? t('permissions.denied.messageNamed', { feature })
            : t('permissions.denied.message')
        }
      />
    </View>
  );
}
