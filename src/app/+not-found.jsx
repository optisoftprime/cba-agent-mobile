import { Stack } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { navigateReplace } from '@/lib/navigate';

export default function NotFoundScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t('common.notFound') }} />
      <View className="flex-1 items-center justify-center gap-3 bg-background px-6">
        <Text className="text-lg font-semibold text-ink">{t('common.notFound')}</Text>
        <Pressable accessibilityRole="link" hitSlop={8} onPress={() => navigateReplace('/')}>
          <Text className="text-base text-primary">{t('common.goHome')}</Text>
        </Pressable>
      </View>
    </>
  );
}
