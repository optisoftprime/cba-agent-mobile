import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getPaymentMethods } from '@/api/mock';
import { AppHeader, NotificationsAction } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { navigateTo } from '@/lib/navigate';

/** Step 3 of 4 — how much, why, and how it was tendered. */
export default function DepositAmountScreen() {
  const { t } = useTranslation();
  const { customerId, accountId } = useLocalSearchParams();

  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [method, setMethod] = useState(null);

  // No validation while we're converting screens — Continue goes straight through.
  const onContinue = () => {
    navigateTo('/deposit/review', {
      customerId,
      accountId,
      amount,
      narration,
      method: method ?? '',
    });
  };

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        showBack
        title={t('deposit.amount.title')}
        subtitle={t('deposit.amount.subtitle')}
        right={<NotificationsAction />}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 28 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          <View className="gap-5">
            <TextField
              label={t('deposit.amount.amount')}
              placeholder={t('deposit.amount.amountPlaceholder')}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />

            <TextField
              label={t('deposit.amount.narration')}
              placeholder={t('deposit.amount.narrationPlaceholder')}
              value={narration}
              onChangeText={setNarration}
            />

            <SelectField
              label={t('deposit.amount.paymentMethod')}
              placeholder={t('deposit.amount.paymentMethodPlaceholder')}
              value={method}
              onChange={setMethod}
              options={getPaymentMethods().map((value) => ({
                value,
                label: t(`deposit.amount.methods.${value}`),
              }))}
            />
          </View>

          <View className="h-8" />

          <Button label={t('deposit.amount.continue')} size="lg" onPress={onContinue} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
