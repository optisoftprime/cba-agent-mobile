import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ajoPlanQuery, recordAjoContribution } from '@/api/ajo';
import { Permission } from '@/api/permissions';
import { AppHeader } from '@/components/layout/app-header';
import { KeyboardView } from '@/components/layout/keyboard-view';
import { LockedScreen } from '@/components/layout/locked-screen';
import { AmountField } from '@/components/ui/amount-field';
import { BalancePanel } from '@/components/ui/balance-panel';
import { Button } from '@/components/ui/button';
import { DetailRows } from '@/components/ui/detail-rows';
import { ErrorState } from '@/components/ui/error-state';
import { MetricPanel } from '@/components/ui/metric-panel';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { SuccessModal } from '@/components/ui/success-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatCurrency, formatDate } from '@/lib/format';
import { AJO_STATUS_TONE } from '@/lib/status';
import { usePermission, usePermissions } from '@/providers/permission-provider';
import { toast } from '@/lib/toast';

/**
 * One Ajo plan, and the place a contribution is recorded against it.
 *
 * NOTE: there is no design for this screen. The spec names a "'{duration} Day
 * Ajo Details'" screen, so one exists somewhere — this is built from the
 * existing pieces until it arrives, and is worth a designer's eye.
 */
export default function AjoPlanScreen() {
  const { t } = useTranslation();
  const access = usePermission(Permission.ajo);
  const { can, guard } = usePermissions();
  const queryClient = useQueryClient();
  const { reference: routeReference } = useLocalSearchParams();

  const reference = String(routeReference ?? '');
  const { data, isPending, isError, error, refetch, isRefetching } = useQuery(
    ajoPlanQuery(reference),
  );

  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState(undefined);
  const [confirming, setConfirming] = useState(false);
  const [recorded, setRecorded] = useState(null);

  const contribution = Number(amount);

  const { mutate, isPending: isRecording } = useMutation({
    mutationFn: recordAjoContribution,
    onSuccess: (plan) => {
      // Recording a contribution also posts an Ajo_Contribution collection
      // server-side, so the collections list and the dashboard figures move
      // too — refreshing only this plan would leave both showing stale money.
      queryClient.invalidateQueries({ queryKey: ['ajoPlan', reference] });
      queryClient.invalidateQueries({ queryKey: ['ajo'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setAmount('');
      setRecorded(plan ?? {});
    },
    onError: (recordError) => toast.error(recordError.message),
  });

  const onRecord = () => {
    if (isRecording) return;
    if (!can(Permission.ajo)) return guard(Permission.ajo);
    if (!Number.isFinite(contribution) || contribution < 0.01) {
      setAmountError(t('ajo.plan.amountRequired'));
      return;
    }
    setAmountError(undefined);
    setConfirming(true);
  };

  const rows = data
    ? [
        {
          key: 'status',
          label: t('ajo.plan.statusLabel'),
          value: (
            <StatusPill
              label={data.status}
              tone={AJO_STATUS_TONE[String(data.status ?? '').toLowerCase()] ?? 'neutral'}
            />
          ),
        },
        { key: 'customer', label: t('ajo.plan.customer'), value: data.customerName },
        {
          key: 'customerCode',
          label: t('ajo.plan.customerCode'),
          value: data.customerCode,
          copyable: true,
        },
        {
          key: 'frequency',
          label: t('ajo.plan.frequency'),
          value: t(`ajo.frequencies.${String(data.frequency ?? '').toLowerCase()}`, {
            defaultValue: data.frequency,
          }),
        },
        {
          key: 'amount',
          label: t('ajo.plan.contributionAmount'),
          value: formatCurrency(data.contributionAmount ?? 0),
        },
        data.duration
          ? {
              key: 'duration',
              label: t('ajo.plan.duration'),
              value: t('ajo.durationDays', { days: data.duration }),
            }
          : null,
        { key: 'start', label: t('ajo.plan.startDate'), value: formatDate(data.startDate) },
        data.maturityDate
          ? {
              key: 'maturity',
              label: t('ajo.plan.maturityDate'),
              value: formatDate(data.maturityDate),
            }
          : null,
        {
          key: 'expected',
          label: t('ajo.plan.expectedTotal'),
          value: formatCurrency(data.expectedTotal ?? 0),
        },
      ].filter(Boolean)
    : [];

  if (!access.allowed) {
    return <LockedScreen showBack title={t('ajo.title')} code={Permission.ajo} />;
  }

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        showBack
        title={data?.planName ?? t('ajo.plan.title')}
        subtitle={data?.reference ?? reference}
      />

      <KeyboardView>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          keyboardShouldPersistTaps="handled">
          {isPending ? (
            <View>
              <Skeleton width="100%" height={118} style={{ borderRadius: 20 }} />
              <View className="mt-4 overflow-hidden rounded-2xl border border-line bg-card">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <View
                    key={i}
                    className={`flex-row items-center justify-between px-4 py-4 ${
                      i < 5 ? 'border-b border-line' : ''
                    }`}>
                    <Skeleton width="30%" height={12} />
                    <Skeleton width="35%" height={12} />
                  </View>
                ))}
              </View>
            </View>
          ) : isError ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : (
            <>
              {/* What is still owed is the number the agent is working towards. */}
              <BalancePanel
                label={t('ajo.plan.remaining')}
                value={formatCurrency(data.remaining ?? 0)}
                footerLeft={t('ajo.plan.paidSoFar', {
                  amount: formatCurrency(data.contributedTotal ?? 0),
                })}
                footerRight={t('ajo.plan.ofExpected', {
                  amount: formatCurrency(data.expectedTotal ?? 0),
                })}
              />

              <MetricPanel
                className="mt-4"
                items={[
                  {
                    key: 'made',
                    label: t('ajo.plan.contributionsMade'),
                    value: String(data.contributionsMade ?? 0),
                  },
                  {
                    key: 'paid',
                    label: t('ajo.plan.contributedTotal'),
                    value: formatCurrency(data.contributedTotal ?? 0),
                  },
                ]}
              />

              <DetailRows className="mt-4" rows={rows} />

              <View className="mt-7 gap-4 rounded-2xl border border-line bg-card p-4">
                <AmountField
                  label={t('ajo.plan.recordLabel')}
                  placeholder={t('ajo.plan.recordPlaceholder')}
                  value={amount}
                  onChangeText={(value) => {
                    setAmount(value);
                    if (amountError) setAmountError(undefined);
                  }}
                  error={amountError}
                  editable={!isRecording}
                />
                <Button
                  label={t('ajo.plan.record')}
                  icon="add-circle-outline"
                  size="lg"
                  loading={isRecording}
                  onPress={onRecord}
                />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardView>

      <ConfirmDialog
        visible={confirming}
        icon="wallet-outline"
        title={t('ajo.plan.confirm.title')}
        message={t('ajo.plan.confirm.message', {
          amount: formatCurrency(Number.isFinite(contribution) ? contribution : 0),
          customer: data?.customerName ?? '',
        })}
        confirmLabel={t('ajo.plan.confirm.confirm')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          mutate({ reference, amount: contribution });
        }}
      />

      <SuccessModal
        visible={recorded !== null}
        title={t('ajo.plan.success.title')}
        message={t('ajo.plan.success.message')}
        details={[
          recorded?.contributionsMade != null && {
            key: 'made',
            label: t('ajo.plan.contributionsMade'),
            value: String(recorded.contributionsMade),
          },
          recorded?.contributedTotal != null && {
            key: 'paid',
            label: t('ajo.plan.contributedTotal'),
            value: formatCurrency(recorded.contributedTotal),
          },
          recorded?.remaining != null && {
            key: 'remaining',
            label: t('ajo.plan.remaining'),
            value: formatCurrency(recorded.remaining),
          },
        ].filter(Boolean)}
        primaryLabel={t('ajo.plan.success.done')}
        onPrimary={() => setRecorded(null)}
      />
    </View>
  );
}
