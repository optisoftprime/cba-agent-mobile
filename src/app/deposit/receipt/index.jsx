import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { getAccountById, getCustomerById } from '@/api/mock';
import { BrandLogo } from '@/components/ui/brand-logo';
import { Button } from '@/components/ui/button';
import { DetailRows } from '@/components/ui/detail-rows';
import { ScallopedEdge } from '@/components/ui/scalloped-edge';
import { formatCurrencyPrecise, maskAccount } from '@/lib/format';
import { brand } from '@/theme/brand';
import { useTheme } from '@/theme/theme-provider';

export default function DepositReceiptScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { customerId, accountId, amount, transactionId, dateTime } = useLocalSearchParams();

  const customer = getCustomerById(customerId);
  const account = getAccountById(accountId);
  const maskedAccount = maskAccount(account?.number);
  const depositedAmount = formatCurrencyPrecise(Number(amount) || 0);

  const rows = [
    { key: 'customer', label: t('deposit.receipt.customer'), value: customer?.name ?? '' },
    { key: 'account', label: t('deposit.receipt.account'), value: maskedAccount },
    { key: 'amount', label: t('deposit.receipt.amount'), value: depositedAmount },
    { key: 'txn', label: t('deposit.receipt.transactionId'), value: transactionId ?? '' },
    { key: 'when', label: t('deposit.receipt.dateTime'), value: dateTime ?? '' },
    { key: 'status', label: t('deposit.receipt.statusLabel'), value: t('deposit.receipt.status') },
  ];

  const onShare = () => {
    Share.share({
      message: t('deposit.receipt.shareMessage', {
        appName: brand.appName,
        amount: depositedAmount,
        account: maskedAccount,
        transactionId,
        dateTime,
      }),
    });
  };

  return (
    <View className="flex-1 bg-primary">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Receipt head, on paper. */}
        <SafeAreaView edges={['top']} className="bg-card">
          <View className="items-end px-5 pt-2">
            <BrandLogo size={44} showName={false} tone="brand" />
          </View>

          <View className="items-center px-8 pb-6">
            <MaterialCommunityIcons name="check-decagram" size={56} color={colors.success} />
            <Text className="mt-4 text-[19px] font-bold text-ink">
              {t('deposit.success.title')}
            </Text>
            <Text className="mt-2 text-[15px] text-ink-muted">{brand.appName}</Text>
            <Text className="mt-1 text-[12px] text-ink-soft">{t('deposit.receipt.title')}</Text>
          </View>
        </SafeAreaView>

        {/* The tear between head and body. */}
        <ScallopedEdge tone="bg-card" />

        <DetailRows rows={rows} tone="primary" className="rounded-none px-2" />

        <View className="px-5 pb-10 pt-8">
          <Button
            variant="outline"
            size="lg"
            label={t('deposit.receipt.share')}
            onPress={onShare}
          />
        </View>
      </ScrollView>
    </View>
  );
}
