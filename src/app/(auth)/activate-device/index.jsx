import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MessageScreen } from '@/components/layout/message-screen';
import { navigateTo } from '@/lib/navigate';
import { brand } from '@/theme/brand';
import { useTheme } from '@/theme/theme-provider';

export default function ActivateDeviceScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
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
  );
}
