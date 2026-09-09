import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getAccountById, getCustomerById, postDeposit } from '@/api/mock';
import { AppHeader, NotificationsAction } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DetailRows } from '@/components/ui/detail-rows';
import { formatCurrencyPrecise } from '@/lib/format';
import { navigateTo } from '@/lib/navigate';

/** Step 4 of 4 — confirm before posting. */
export default function DepositReviewScreen() {
  const { t } = useTranslation();
  // `method` is carried in the params too — the design doesn't show it here,
  // but the post request will need it.
  const { customerId, accountId, amount, narration } = useLocalSearchParams();

  const [confirming, setConfirming] = useState(false);

  const customer = getCustomerById(customerId);
  const account = getAccountById(accountId);

  const rows = [
    {
      key: 'customer',
      label: t('deposit.review.customer'),
      value: (
        <View className="items-end">
          <Text className="text-[14px] font-medium text-primary">{customer?.name}</Text>
          <Text className="text-[14px] font-medium text-primary">{customer?.code}</Text>
        </View>
      ),
    },
    {
      key: 'account',
      label: t('deposit.review.account'),
      value: (
        <View className="items-end">
          <Text className="text-[14px] font-medium text-ink">{account?.name}</Text>
          <Text className="text-[14px] font-medium text-ink">{account?.number}</Text>
        </View>
      ),
    },
    {
      key: 'amount',
      label: t('deposit.review.amount'),
      value: formatCurrencyPrecise(Number(amount) || 0),
    },
    { key: 'narration', label: t('deposit.review.narration'), value: narration || '—' },
  ];

  const onConfirm = () => {
    setConfirming(false);
    const result = postDeposit({ accountId, amount });
    navigateTo('/deposit/success', {
      customerId,
      accountId,
      amount,
      transactionId: result.transactionId,
      dateTime: result.dateTime,
      newBalance: String(result.newBalance),
    });
  };

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        showBack
        title={t('deposit.review.title')}
        subtitle={t('deposit.review.subtitle')}
        right={<NotificationsAction />}
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}>
        <DetailRows rows={rows} />

        <Button
          className="mt-8"
          label={t('deposit.review.confirm')}
          size="lg"
          onPress={() => setConfirming(true)}
        />
      </ScrollView>

      <ConfirmDialog
        visible={confirming}
        title={t('deposit.confirm.title')}
        message={t('deposit.confirm.message', {
          amount: formatCurrencyPrecise(Number(amount) || 0),
          customer: customer?.name,
          account: account?.name,
        })}
        cancelLabel={t('deposit.confirm.cancel')}
        confirmLabel={t('deposit.confirm.confirm')}
        onCancel={() => setConfirming(false)}
        onConfirm={onConfirm}
      />
    </View>
  );
}
