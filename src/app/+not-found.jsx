import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function NotFoundScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t('common.notFound') }} />
      <View className="flex-1 items-center justify-center gap-3 bg-background px-6">
        <Text className="text-lg font-semibold text-ink">{t('common.notFound')}</Text>
        <Link href="/" className="text-base text-primary">
          {t('common.goHome')}
        </Link>
      </View>
    </>
  );
}
