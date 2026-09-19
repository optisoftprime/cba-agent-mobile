import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MessageScreen } from '@/components/layout/message-screen';
import { NoGoingBack } from '@/components/layout/no-going-back';
import { navigateReset, navigateTo } from '@/lib/navigate';
import { brand } from '@/theme/brand';
import { useTheme } from '@/theme/theme-provider';

export default function ActivateDeviceScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <>
      {/* This screen is a GATE, not a step. It had a back arrow, and the
          hardware back was unguarded, so an agent whose device access had been
          reset could simply walk back into whatever screen was underneath.
          Back now returns to login — and the fingerprint there routes straight
          back here, so the loop is closed rather than leaky. */}
      <NoGoingBack onBack={() => navigateReset('/(auth)/login')} />

      <MessageScreen
        icon={
          <View className="h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Ionicons name="information" size={32} color={colors.onPrimary} />
          </View>
        }
        title={t('auth.activateDevice.title')}
        message={t('auth.activateDevice.message', { appName: brand.appName })}
        actionLabel={t('auth.activateDevice.action')}
        onAction={() => navigateTo('/(auth)/activate-code')}
      />
    </>
  );
}
