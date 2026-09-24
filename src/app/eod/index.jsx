import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EOD_KEY, EodStatus, eodCurrentQuery, eodState, submitEod } from '@/api/eod';
import { VarianceText, useVarianceLabel } from '@/components/eod/variance-text';
import { AppHeader } from '@/components/layout/app-header';
import { KeyboardView } from '@/components/layout/keyboard-view';
import { AlertBanner } from '@/components/ui/alert-banner';
import { AmountField } from '@/components/ui/amount-field';
import { BalancePanel } from '@/components/ui/balance-panel';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DetailRows } from '@/components/ui/detail-rows';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { SuccessModal } from '@/components/ui/success-modal';
import { formatCurrencyPrecise, formatDate, formatDateTime } from '@/lib/format';
import { navigateTo } from '@/lib/navigate';
import { EOD_STATUS_TONE } from '@/lib/status';
import { toast } from '@/lib/toast';
import { useRefreshWithPermissions } from '@/providers/permission-provider';

/**
 * End of day — count the cash you are holding and close the day.
 *
 * Three states, all driven by `eodState()`:
 *   open      nothing submitted yet → the count form
 *   variance  submitted but did not match → the mismatch, and the form again
 *             so the agent can recount
 *   closed    Balanced → the result, no form; nothing left to do today
 *
 * Remitting cash to the branch lives here too, because it changes what the
 * agent is expected to count — remit first, then count.
 */
export default function EodScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data, isPending, isError, error, refetch, isRefetching } = useQuery(eodCurrentQuery);
  const onRefresh = useRefreshWithPermissions(refetch);

  const [counted, setCounted] = useState('');
  const [countError, setCountError] = useState(undefined);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState(null);

  const state = eodState(data);
  const resolved = String(data?.status ?? '').toUpperCase() === EodStatus.resolved;
  const expected = Number(data?.expectedCash ?? 0);
  // Empty is "not entered yet", which is different from a count of zero.
  const countedValue = counted.trim() === '' ? null : Number(counted);
  const preview = countedValue == null ? null : countedValue - expected;
  const resultRecord = result === 'submitted' ? null : result;
  const resultVarianceLabel = useVarianceLabel(resultRecord?.variance);

  const { mutate, isPending: submitting } = useMutation({
    mutationFn: submitEod,
    onSuccess: (record) => {
      // A Balanced day lifts the reconciliation hold the dashboard shows.
      queryClient.invalidateQueries({ queryKey: EOD_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setCounted('');
      // `?? {}` would be read by eodState() as an un-submitted day and shown as
      // a variance with ₦0.00 figures — a wrong outcome for a submit that
      // worked. `submitted` is the "it landed, the server told us nothing"
      // case; the screen refetches and shows the real position underneath.
      setResult(record ?? 'submitted');
    },
    onError: (submitError) => toast.error(submitError.message),
  });

  const onSubmit = () => {
    if (submitting) return;
    // Zero is a legitimate count; only a blank or unreadable entry is not.
    if (countedValue == null || !Number.isFinite(countedValue) || countedValue < 0) {
      setCountError(t('eod.count.required'));
      return;
    }
    setCountError(undefined);
    setConfirming(true);
  };

  const positionRows = data
    ? [
        {
          key: 'status',
          label: t('eod.position.status'),
          value: (
            <StatusPill
              label={data.status ?? t('eod.state.open')}
              tone={EOD_STATUS_TONE[String(data.status ?? '').toLowerCase()] ?? 'neutral'}
            />
          ),
        },
        { key: 'settled', label: t('eod.position.settled'), value: formatCurrencyPrecise(data.settledCash ?? 0) },
        { key: 'in', label: t('eod.position.pendingIn'), value: formatCurrencyPrecise(data.pendingIn ?? 0) },
        { key: 'out', label: t('eod.position.pendingOut'), value: formatCurrencyPrecise(data.pendingOut ?? 0) },
        {
          key: 'expected',
          label: t('eod.position.expected'),
          value: formatCurrencyPrecise(expected),
          tone: 'link',
        },
      ]
    : [];

  // What was submitted, once there is a submission to show.
  const submissionRows =
    data && state !== 'open'
      ? [
          {
            key: 'counted',
            label: t('eod.position.counted'),
            value: formatCurrencyPrecise(data.countedCash ?? 0),
          },
          {
            key: 'variance',
            label: t('eod.position.variance'),
            value: <VarianceText variance={data.variance} />,
          },
          data.submittedAt
            ? {
                key: 'when',
                label: t('eod.position.submittedAt'),
                value: formatDateTime(data.submittedAt),
              }
            : null,
          data.resolutionNote
            ? { key: 'note', label: t('eod.position.resolution'), value: data.resolutionNote }
            : null,
        ].filter(Boolean)
      : [];

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        showBack
        title={t('eod.title')}
        subtitle={data?.businessDate ? formatDate(data.businessDate) : t('eod.subtitle')}
      />

      <KeyboardView>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching && !isPending} onRefresh={onRefresh} />
          }>
          {isPending ? (
            <View className="gap-4">
              <Skeleton height={118} radius={16} />
              <Skeleton height={260} radius={16} />
              <Skeleton height={150} radius={16} />
            </View>
          ) : isError ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : (
            <View className="gap-4">
              <BalancePanel
                label={t('eod.position.expected')}
                value={formatCurrencyPrecise(expected)}
                footerLeft={t('eod.position.settledShort', {
                  amount: formatCurrencyPrecise(data.settledCash ?? 0),
                })}
              />

              {state === 'variance' ? (
                <AlertBanner
                  tone="warning"
                  title={t('eod.state.varianceTitle')}
                  message={t('eod.state.varianceMessage')}
                />
              ) : null}

              {/* Closed either way; the wording says whether it balanced or a
                  supervisor settled the difference. */}
              {state === 'closed' ? (
                <AlertBanner
                  tone="info"
                  title={resolved ? t('eod.state.resolvedTitle') : t('eod.state.closedTitle')}
                  message={resolved ? t('eod.state.resolvedMessage') : t('eod.state.closedMessage')}
                />
              ) : null}

              <DetailRows rows={positionRows} />

              {submissionRows.length ? <DetailRows rows={submissionRows} /> : null}

              {/* The count form — hidden once the day is closed, because there
                  is nothing left to submit. */}
              {state !== 'closed' ? (
                <View className="gap-4 rounded-2xl border border-line bg-card p-4">
                  <AmountField
                    label={t('eod.count.label')}
                    placeholder={t('eod.count.placeholder')}
                    value={counted}
                    onChangeText={(value) => {
                      setCounted(value);
                      if (countError) setCountError(undefined);
                    }}
                    error={countError}
                    editable={!submitting}
                  />

                  {/* Read the difference back BEFORE submitting, so a miscount
                      is caught while the cash is still on the table. */}
                  {preview != null && Number.isFinite(preview) ? (
                    <DetailRows
                      rows={[
                        {
                          key: 'preview',
                          label: t('eod.count.difference'),
                          value: <VarianceText variance={preview} />,
                        },
                      ]}
                    />
                  ) : null}

                  <Button
                    label={state === 'variance' ? t('eod.count.resubmit') : t('eod.count.submit')}
                    size="lg"
                    loading={submitting}
                    onPress={onSubmit}
                  />
                </View>
              ) : null}

              <Button
                variant="outline"
                size="lg"
                icon="arrow-up-circle-outline"
                label={t('eod.remit')}
                onPress={() => navigateTo('/remittance')}
              />

              <Button
                variant="ghost"
                icon="time-outline"
                label={t('eod.history.open')}
                onPress={() => navigateTo('/eod/history')}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardView>

      <ConfirmDialog
        visible={confirming}
        icon="calculator-outline"
        title={t('eod.confirm.title')}
        message={t('eod.confirm.message', { amount: formatCurrencyPrecise(countedValue ?? 0) })}
        confirmLabel={t('eod.confirm.confirm')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          mutate({ countedCash: countedValue });
        }}
      />

      {/* Balanced is a finished day (tick). Variance is a submitted count that
          did not match — the day is NOT closed, so it gets the amber clock. */}
      <SuccessModal
        visible={result !== null}
        tone={eodState(resultRecord) === 'closed' ? 'success' : 'pending'}
        title={
          !resultRecord
            ? t('eod.done.submittedTitle')
            : eodState(resultRecord) === 'closed'
              ? t('eod.done.balancedTitle')
              : t('eod.done.varianceTitle')
        }
        message={
          !resultRecord
            ? t('eod.done.submittedMessage')
            : eodState(resultRecord) === 'closed'
              ? t('eod.done.balancedMessage')
              : t('eod.done.varianceMessage')
        }
        // No rows at all when the server returned no record: better to say
        // nothing than to print ₦0.00 as though it had been counted.
        details={
          resultRecord
            ? [
                {
                  key: 'expected',
                  label: t('eod.position.expected'),
                  value: formatCurrencyPrecise(resultRecord.expectedCash),
                },
                {
                  key: 'counted',
                  label: t('eod.position.counted'),
                  value: formatCurrencyPrecise(resultRecord.countedCash),
                },
                { key: 'variance', label: t('eod.position.variance'), value: resultVarianceLabel },
              ]
            : []
        }
        primaryLabel={t('eod.done.ok')}
        onPrimary={() => setResult(null)}
      />
    </View>
  );
}
