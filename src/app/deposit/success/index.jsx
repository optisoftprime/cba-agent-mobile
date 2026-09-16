import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { getAccountById } from '@/api/mock';
import { NoGoingBack } from '@/components/layout/no-going-back';
import { Button } from '@/components/ui/button';
import { DetailRows } from '@/components/ui/detail-rows';
import { formatCurrencyPrecise } from '@/lib/format';
import { navigateReset, navigateTo } from '@/lib/navigate';
import { useTheme } from '@/theme/theme-provider';

export default function DepositSuccessScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const { customerId, accountId, amount, transactionId, dateTime, newBalance } = params;

  const account = getAccountById(accountId);
  const depositedAmount = formatCurrencyPrecise(Number(amount) || 0);

  const rows = [
    { key: 'amount', label: t('deposit.success.amount'), value: depositedAmount, tone: 'link' },
    { key: 'account', label: t('deposit.success.account'), value: account?.number ?? '' },
    {
      key: 'balance',
      label: t('deposit.success.newBalance'),
      value: formatCurrencyPrecise(Number(newBalance) || 0),
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* The deposit is posted. Going back to the review screen would offer to
          post it again, so back does what Done does. */}
      <NoGoingBack onBack={() => navigateReset('/(tabs)')} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}>
        <View className="items-center pt-16">
          <MaterialCommunityIcons name="check-decagram" size={64} color={colors.success} />
          <Text className="mt-5 text-[19px] font-bold text-ink">{t('deposit.success.title')}</Text>
          <Text className="mt-2 text-center text-[13px] leading-5 text-ink-muted">
            {t('deposit.success.message', { amount: depositedAmount })}
          </Text>
        </View>

        <DetailRows rows={rows} className="mt-8 rounded-none border-0" />

        <View className="min-h-10 flex-1" />

        <View className="gap-3">
          <Button
            label={t('deposit.success.done')}
            size="lg"
            onPress={() => navigateReset('/(tabs)')}
          />
          <Button
            variant="outline"
            size="lg"
            label={t('deposit.success.viewReceipt')}
            onPress={() =>
              navigateTo('/deposit/receipt', {
                customerId,
                accountId,
                amount,
                transactionId,
                dateTime,
              })
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
