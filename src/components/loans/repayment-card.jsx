import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MetricPanel } from '@/components/ui/metric-panel';
import { StatusPill } from '@/components/ui/status-pill';
import { formatCurrency, formatDate } from '@/lib/format';
import { SCHEDULE_STATUS_TONE } from '@/lib/status';
import { useTheme } from '@/theme/theme-provider';

/**
 * One instalment from a loan's schedule, as the server sends it:
 * { dueDate, principalAmount, interestAmount, totalDue, amountPaid, status }.
 */
export function RepaymentCard({ repayment }) {
  const { t } = useTranslation();
  const { shadows } = useTheme();

  const paid = Number(repayment.amountPaid) || 0;

  return (
    <View style={shadows.sm} className="mb-3 rounded-xl border border-line bg-card p-4">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-[15px] font-semibold text-ink">{formatDate(repayment.dueDate)}</Text>
        <StatusPill
          label={repayment.status}
          tone={SCHEDULE_STATUS_TONE[String(repayment.status ?? '').toLowerCase()] ?? 'neutral'}
        />
      </View>

      <MetricPanel
        className="mt-3"
        items={[
          {
            label: t('loans.detail.principalShort'),
            value: formatCurrency(repayment.principalAmount ?? 0),
          },
          {
            label: t('loans.detail.interestShort'),
            value: formatCurrency(repayment.interestAmount ?? 0),
          },
          { label: t('loans.detail.totalDue'), value: formatCurrency(repayment.totalDue ?? 0) },
        ]}
      />

      {/* Only worth a line once something has actually been paid. */}
      {paid > 0 ? (
        <Text className="mt-3 text-[13px] text-ink-muted">
          {t('loans.detail.paid', { amount: formatCurrency(paid) })}
        </Text>
      ) : null}
    </View>
  );
}
