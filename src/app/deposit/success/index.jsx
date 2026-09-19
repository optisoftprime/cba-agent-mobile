import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { NoGoingBack } from '@/components/layout/no-going-back';
import { AlertBanner } from '@/components/ui/alert-banner';
import { Button } from '@/components/ui/button';
import { DetailRows } from '@/components/ui/detail-rows';
import { formatCurrencyPrecise, formatDateTime } from '@/lib/format';
import { navigateReset, navigateTo } from '@/lib/navigate';
import { useTheme } from '@/theme/theme-provider';

/**
 * The end of the deposit.
 *
 * `status` decides what this screen is allowed to claim. `Posted` means the
 * money is in and `customerBalanceAfter` is the new balance. `Pending` means it
 * is over the agent's cap and waiting on approval — the money has NOT landed,
 * so no green tick, no "new balance", and `pendingReason` is shown instead.
 * Telling an agent a deposit succeeded when it is queued is how a customer gets
 * told their money arrived when it hasn't.
 */
export default function DepositSuccessScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const {
    customerCode,
    customerName,
    accountNumber,
    accountName,
    amount,
    status,
    transactionId,
    capturedAt,
    businessDate,
    customerBalanceAfter,
    cashInHand,
    pendingReason,
    duplicate,
  } = useLocalSearchParams();

  const posted = String(status ?? '').toUpperCase() === 'POSTED';
  const depositedAmount = formatCurrencyPrecise(Number(amount) || 0);

  const rows = [
    { key: 'amount', label: t('deposit.success.amount'), value: depositedAmount, tone: 'link' },
    { key: 'account', label: t('deposit.success.account'), value: String(accountNumber ?? '') },
    ...(posted && customerBalanceAfter
      ? [
          {
            key: 'balance',
            label: t('deposit.success.newBalance'),
            value: formatCurrencyPrecise(Number(customerBalanceAfter) || 0),
          },
        ]
      : []),
    ...(transactionId
      ? [
          {
            key: 'txn',
            label: t('deposit.success.transactionId'),
            value: String(transactionId),
            copyable: true,
          },
        ]
      : []),
    ...(cashInHand
      ? [
          {
            key: 'cash',
            label: t('deposit.success.cashInHand'),
            value: formatCurrencyPrecise(Number(cashInHand) || 0),
          },
        ]
      : []),
    ...(capturedAt
      ? [{ key: 'when', label: t('deposit.success.dateTime'), value: formatDateTime(capturedAt) }]
      : []),
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
          <MaterialCommunityIcons
            name={posted ? 'check-decagram' : 'clock-outline'}
            size={64}
            color={posted ? colors.success : colors.warning}
          />
          <Text className="mt-5 text-[19px] font-bold text-ink">
            {posted ? t('deposit.success.title') : t('deposit.success.pendingTitle')}
          </Text>
          <Text className="mt-2 text-center text-[13px] leading-5 text-ink-muted">
            {posted
              ? t('deposit.success.message', { amount: depositedAmount })
              : t('deposit.success.pendingMessage', { amount: depositedAmount })}
          </Text>
        </View>

        {!posted && pendingReason ? (
          <AlertBanner
            className="mt-6"
            tone="warning"
            title={t('deposit.success.pendingReason')}
            message={String(pendingReason)}
          />
        ) : null}

        {/* The server recognised this clientReference and did NOT take the money
            a second time — worth saying, or the agent posts it again by hand. */}
        {duplicate ? (
          <AlertBanner
            className="mt-6"
            tone="info"
            title={t('deposit.success.duplicateTitle')}
            message={t('deposit.success.duplicateMessage')}
          />
        ) : null}

        <DetailRows rows={rows} className="mt-8 rounded-none border-0" />

        {businessDate ? (
          <Text className="mt-4 text-center text-[12px] text-ink-soft">
            {t('deposit.success.businessDate', { date: String(businessDate) })}
          </Text>
        ) : null}

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
                customerCode,
                customerName: customerName ?? '',
                accountNumber,
                accountName: accountName ?? '',
                amount,
                status,
                transactionId,
                capturedAt,
                customerBalanceAfter,
              })
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
