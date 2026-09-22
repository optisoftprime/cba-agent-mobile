import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EOD_KEY, eodCurrentQuery } from '@/api/eod';
import { postRemittance } from '@/api/remittances';
import { AppHeader } from '@/components/layout/app-header';
import { KeyboardView } from '@/components/layout/keyboard-view';
import { AmountField } from '@/components/ui/amount-field';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DetailRows } from '@/components/ui/detail-rows';
import { SuccessModal } from '@/components/ui/success-modal';
import { TextField } from '@/components/ui/text-field';
import { isPosted, newClientReference } from '@/lib/cash-movement';
import { formatCurrencyPrecise, formatDateTime } from '@/lib/format';
import { navigateBack } from '@/lib/navigate';
import { toast } from '@/lib/toast';

/** The server rejects anything under this: "must be greater than or equal to 0.01". */
const MIN_AMOUNT = 0.01;

/**
 * Remit cash to the branch — hand back cash the agent is holding.
 *
 * Reached from the dashboard and from End of day: remitting lowers what the
 * day expects the agent to count, so it naturally comes just before counting.
 *
 * Same money rules as a deposit:
 * - ONE clientReference per visit, fixed on mount — a retry after a timeout
 *   must reuse it, or the server sees a second remittance.
 * - `Pending` means the cash has NOT moved yet: amber clock, not a tick.
 */
export default function RemittanceScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Context only — what the day expects them to be holding. A failure here
  // must not stop them remitting, so its error state is simply "not shown".
  const { data: day } = useQuery(eodCurrentQuery);

  const [clientReference] = useState(newClientReference);
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [error, setError] = useState(undefined);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState(null);

  const value = Number(amount);
  const valid = Number.isFinite(value) && value >= MIN_AMOUNT;

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      postRemittance({ amount: value, clientReference, narration: narration.trim() }),
    onSuccess: (movement) => {
      // Cash in hand and the day's expected cash both just changed.
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: EOD_KEY });
      setResult(movement ?? {});
    },
    onError: (postError) => toast.error(postError.message),
  });

  const onContinue = () => {
    if (isPending) return;
    if (!valid) {
      setError(amount.trim() ? t('remittance.tooSmall') : t('remittance.amountRequired'));
      return;
    }
    setConfirming(true);
  };

  const posted = isPosted(result);
  const remitted = formatCurrencyPrecise(Number(result?.amount ?? value) || 0);

  return (
    <View className="flex-1 bg-background">
      <AppHeader showBack title={t('remittance.title')} subtitle={t('remittance.subtitle')} />

      <KeyboardView>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 28 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          <View className="gap-5">
            {day?.expectedCash != null ? (
              <DetailRows
                rows={[
                  {
                    key: 'holding',
                    label: t('remittance.holding'),
                    value: formatCurrencyPrecise(day.expectedCash),
                  },
                ]}
              />
            ) : null}

            <AmountField
              label={t('remittance.amount')}
              placeholder={t('remittance.amountPlaceholder')}
              value={amount}
              onChangeText={(next) => {
                setAmount(next);
                if (error) setError(undefined);
              }}
              error={error}
              editable={!isPending}
            />

            <TextField
              label={t('remittance.narration')}
              placeholder={t('remittance.narrationPlaceholder')}
              value={narration}
              onChangeText={setNarration}
              editable={!isPending}
            />

            {/* Read the figure back in full — an extra zero is ten times the cash. */}
            {valid ? (
              <DetailRows
                rows={[
                  {
                    key: 'preview',
                    label: t('remittance.youAreRemitting'),
                    value: formatCurrencyPrecise(value),
                    tone: 'link',
                  },
                ]}
              />
            ) : null}
          </View>

          <View className="min-h-8 flex-1" />

          <Button
            label={t('remittance.submit')}
            size="lg"
            loading={isPending}
            onPress={onContinue}
          />
        </ScrollView>
      </KeyboardView>

      <ConfirmDialog
        visible={confirming}
        icon="arrow-up-circle-outline"
        title={t('remittance.confirm.title')}
        message={t('remittance.confirm.message', { amount: formatCurrencyPrecise(value || 0) })}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('remittance.confirm.confirm')}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          mutate();
        }}
      />

      {/* Done leaves the screen: a remitted form must not sit there inviting a
          second tap (the server would answer `duplicate`, but the agent should
          never have to find that out). */}
      <SuccessModal
        visible={result !== null}
        tone={posted ? 'success' : 'pending'}
        title={posted ? t('remittance.done.title') : t('remittance.done.pendingTitle')}
        message={
          result?.duplicate
            ? t('remittance.done.duplicate')
            : posted
              ? t('remittance.done.message', { amount: remitted })
              : result?.pendingReason || t('remittance.done.pendingMessage', { amount: remitted })
        }
        details={[
          { key: 'amount', label: t('remittance.amount'), value: remitted },
          result?.transactionId
            ? { key: 'txn', label: t('remittance.done.reference'), value: result.transactionId }
            : null,
          posted && result?.cashInHand != null
            ? {
                key: 'cash',
                label: t('remittance.done.cashInHand'),
                value: formatCurrencyPrecise(result.cashInHand),
              }
            : null,
          result?.capturedAt
            ? { key: 'when', label: t('remittance.done.when'), value: formatDateTime(result.capturedAt) }
            : null,
        ]}
        primaryLabel={t('remittance.done.ok')}
        onPrimary={() => {
          setResult(null);
          navigateBack('/(tabs)');
        }}
      />
    </View>
  );
}
