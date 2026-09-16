import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useTheme } from '@/theme/theme-provider';

/**
 * THE failure state. Every screen and every tab that can fail to load uses
 * this, so a failure looks the same everywhere instead of being a bare line of
 * grey text on one screen and something else on the next.
 *
 * The icon and heading come from WHY it failed — an agent with no signal needs
 * to know that, not "Something went wrong". The server's own message is shown
 * underneath, since it is written for the agent (see `send` in api/client).
 */
const BY_CODE = {
  NETWORK: { icon: 'cloud-offline-outline', title: 'common.errors.offlineTitle' },
  TIMEOUT: { icon: 'time-outline', title: 'common.errors.timeoutTitle' },
};

const FALLBACK = { icon: 'alert-circle-outline', title: 'common.errors.title' };

export function ErrorState({ error, onRetry, compact = false }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const { icon, title } = BY_CODE[error?.code] ?? FALLBACK;
  const message = error?.message ?? t('common.errors.generic');

  return (
    <View className={`items-center px-8 ${compact ? 'py-10' : 'py-16'}`}>
      <View
        className={`items-center justify-center rounded-full bg-danger-soft ${
          compact ? 'h-12 w-12' : 'h-16 w-16'
        }`}>
        <Ionicons name={icon} size={compact ? 24 : 30} color={colors.onDangerSoft} />
      </View>

      <Text className="mt-4 text-center text-[15px] font-semibold text-ink">{t(title)}</Text>
      <Text className="mt-1.5 text-center text-[13px] leading-5 text-ink-muted">{message}</Text>

      {onRetry ? (
        <Button
          className="mt-5"
          variant="outline"
          size={compact ? 'sm' : 'md'}
          icon="refresh"
          label={t('common.retry')}
          onPress={onRetry}
        />
      ) : null}
    </View>
  );
}
