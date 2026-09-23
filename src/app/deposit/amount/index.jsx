import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Permission } from '@/api/permissions';
import { AppHeader } from '@/components/layout/app-header';
import { KeyboardView } from '@/components/layout/keyboard-view';
import { LockedScreen } from '@/components/layout/locked-screen';
import { AmountField } from '@/components/ui/amount-field';
import { Button } from '@/components/ui/button';
import { DetailRows } from '@/components/ui/detail-rows';
import { TextField } from '@/components/ui/text-field';
import { formatCurrencyPrecise } from '@/lib/format';
import { navigateTo } from '@/lib/navigate';
import { usePermission } from '@/providers/permission-provider';

/** The server rejects anything under this: "must be greater than or equal to 0.01". */
const MIN_AMOUNT = 0.01;

/**
 * Step 3 of 4 — how much, and why.
 *
 * TODO(backend): the design also has a Payment method selector, and it is
 * deliberately NOT here. `POST /agent/deposits` has no `paymentMethod` field,
 * so anything chosen would be silently discarded and the resulting collection
 * record would show the wrong tender — worse than not asking. Restore it the
 * moment the field exists (and `GET /agent/payment-methods` with it, so the
 * options are the bank's rather than four hardcoded strings).
 */
export default function DepositAmountScreen() {
  const { t } = useTranslation();
  const access = usePermission(Permission.deposit);
  const { customerCode, customerName, accountNumber, accountName } = useLocalSearchParams();

  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [error, setError] = useState(undefined);

  const value = Number(amount);
  const valid = Number.isFinite(value) && value >= MIN_AMOUNT;

  const onContinue = () => {
    if (!valid) {
      setError(
        amount.trim() ? t('deposit.amount.tooSmall') : t('deposit.amount.amountRequired'),
      );
      return;
    }

    navigateTo('/deposit/review', {
      customerCode,
      customerName: customerName ?? '',
      accountNumber,
      accountName: accountName ?? '',
      // Normalised here so the review screen and the request agree to the kobo.
      amount: String(value),
      narration: narration.trim(),
    });
  };

  if (!access.allowed) {
    return <LockedScreen showBack title={t('deposit.amount.title')} code={Permission.deposit} />;
  }

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        showBack
        title={t('deposit.amount.title')}
        subtitle={accountName ? String(accountName) : t('deposit.amount.subtitle')}
      />

      <KeyboardView>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 28 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          <View className="gap-5">
            <DetailRows
              rows={[
                {
                  key: 'customer',
                  label: t('deposit.amount.customer'),
                  value: customerName ? String(customerName) : String(customerCode ?? ''),
                },
                {
                  key: 'account',
                  label: t('deposit.amount.account'),
                  value: String(accountNumber ?? ''),
                },
              ]}
            />

            <AmountField
              label={t('deposit.amount.amount')}
              placeholder={t('deposit.amount.amountPlaceholder')}
              value={amount}
              onChangeText={(next) => {
                setAmount(next);
                if (error) setError(undefined);
              }}
              error={error}
            />

            <TextField
              label={t('deposit.amount.narration')}
              placeholder={t('deposit.amount.narrationPlaceholder')}
              value={narration}
              onChangeText={setNarration}
            />

            {/* Reads the typed figure back in full so a mistyped extra zero is
                obvious before the review screen, not after. */}
            {valid ? (
              <DetailRows
                rows={[
                  {
                    key: 'preview',
                    label: t('deposit.amount.youArePosting'),
                    value: formatCurrencyPrecise(value),
                    tone: 'primary',
                  },
                ]}
              />
            ) : null}
          </View>

          <View className="min-h-8 flex-1" />

          <Button label={t('deposit.amount.continue')} size="lg" onPress={onContinue} />
        </ScrollView>
      </KeyboardView>
    </View>
  );
}
