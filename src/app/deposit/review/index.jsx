import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { newClientReference, postDeposit } from '@/api/deposits';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DetailRows } from '@/components/ui/detail-rows';
import { formatCurrencyPrecise } from '@/lib/format';
import { getCaptureLocation } from '@/lib/location';
import { navigateReplace } from '@/lib/navigate';
import { toast } from '@/lib/toast';

/** Step 4 of 4 — confirm, then post. */
export default function DepositReviewScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { customerCode, customerName, accountNumber, accountName, amount, narration } =
    useLocalSearchParams();

  const [confirming, setConfirming] = useState(false);

  // ONE reference for this attempt, fixed when the screen mounts. Generating it
  // per tap would turn the server's duplicate protection off: a retry after a
  // timeout would arrive as a brand new deposit and take the money twice.
  const [clientReference] = useState(newClientReference);

  const value = Number(amount) || 0;

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      // Best effort, never blocking — see src/lib/location.js.
      const where = await getCaptureLocation();
      return postDeposit({
        accountNumber: String(accountNumber ?? ''),
        amount: value,
        clientReference,
        narration: narration ? String(narration) : undefined,
        latitude: where?.latitude,
        longitude: where?.longitude,
      });
    },
    onSuccess: (result) => {
      // The money moved: the agent's own figures and the customer's records are
      // all stale now.
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      // ['customer', code] is a PREFIX — this also clears that customer's
      // accounts, overview, loans and activity, whose balances just changed.
      queryClient.invalidateQueries({ queryKey: ['customer', String(customerCode ?? '')] });

      // Replace, not push: the review screen must not survive underneath a
      // posted deposit where it could be walked back into and confirmed again.
      navigateReplace('/deposit/success', {
        customerCode,
        customerName: customerName ?? '',
        accountNumber: result?.accountNumber ?? accountNumber,
        accountName: accountName ?? '',
        amount: String(result?.amount ?? value),
        status: result?.status ?? '',
        transactionId: result?.transactionId ?? '',
        capturedAt: result?.capturedAt ?? '',
        businessDate: result?.businessDate ?? '',
        customerBalanceAfter:
          result?.customerBalanceAfter != null ? String(result.customerBalanceAfter) : '',
        cashInHand: result?.cashInHand != null ? String(result.cashInHand) : '',
        pendingReason: result?.pendingReason ?? '',
        duplicate: result?.duplicate ? '1' : '',
      });
    },
    onError: (error) => toast.error(error.message),
  });

  const rows = [
    {
      key: 'customer',
      label: t('deposit.review.customer'),
      value: (
        <View className="items-end">
          <Text className="text-[14px] font-medium text-primary">{String(customerName ?? '')}</Text>
          <Text className="text-[14px] font-medium text-primary">{String(customerCode ?? '')}</Text>
        </View>
      ),
    },
    {
      key: 'account',
      label: t('deposit.review.account'),
      value: (
        <View className="items-end">
          <Text className="text-[14px] font-medium text-ink">{String(accountName ?? '')}</Text>
          <Text className="text-[14px] font-medium text-ink">{String(accountNumber ?? '')}</Text>
        </View>
      ),
    },
    { key: 'amount', label: t('deposit.review.amount'), value: formatCurrencyPrecise(value) },
    {
      key: 'narration',
      label: t('deposit.review.narration'),
      value: narration ? String(narration) : '—',
    },
  ];

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        showBack
        title={t('deposit.review.title')}
        subtitle={t('deposit.review.subtitle')}
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}>
        <DetailRows rows={rows} />

        <Button
          className="mt-8"
          label={t('deposit.review.confirm')}
          size="lg"
          loading={isPending}
          onPress={() => setConfirming(true)}
        />
      </ScrollView>

      <ConfirmDialog
        visible={confirming}
        title={t('deposit.confirm.title')}
        message={t('deposit.confirm.message', {
          amount: formatCurrencyPrecise(value),
          customer: String(customerName ?? ''),
          account: String(accountNumber ?? ''),
        })}
        cancelLabel={t('deposit.confirm.cancel')}
        confirmLabel={t('deposit.confirm.confirm')}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          mutate();
        }}
      />
    </View>
  );
}
