import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { navigateBack } from '@/lib/navigate';
import { useTheme } from '@/theme/theme-provider';

/**
 * A single centred message with one action at the bottom — the shape shared by
 * "Device Activation Required" and "Code Verified".
 *
 * `icon` is a node so each screen picks its own mark and colour. `showBack`
 * adds a back arrow; leave it off for a screen that ends a process and pair
 * that with NoGoingBack.
 */
export function MessageScreen({
  icon = null,
  title,
  message,
  actionLabel,
  onAction,
  showBack = false,
  onBackPress,
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-background">
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          hitSlop={12}
          onPress={() => (onBackPress ? onBackPress() : navigateBack('/(auth)/login'))}
          className="ml-4 mt-2 h-10 w-10 items-center justify-center">
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
      ) : null}

      <View className="flex-1 items-center justify-center px-8">
        {icon}
        <Text className="mt-6 text-center text-[19px] font-bold text-ink">{title}</Text>
        {message ? (
          <Text className="mt-2.5 text-center text-[14px] leading-6 text-ink-muted">{message}</Text>
        ) : null}
      </View>

      {actionLabel ? (
        <View className="px-6 pb-8">
          <Button label={actionLabel} size="lg" onPress={onAction} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
