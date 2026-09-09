import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MetricPanel } from '@/components/ui/metric-panel';
import { StatusPill } from '@/components/ui/status-pill';
import { formatCurrency } from '@/lib/format';
import { SCHEDULE_STATUS_TONE } from '@/lib/status';
import { useTheme } from '@/theme/theme-provider';

/** One row of a loan's repayment schedule. */
export function RepaymentCard({ repayment }) {
  const { t } = useTranslation();
  const { shadows } = useTheme();

  return (
    <View style={shadows.sm} className="mb-3 rounded-xl border border-line bg-card p-4">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-[15px] font-semibold text-ink">{repayment.date}</Text>
        <StatusPill
          label={t(`loans.scheduleStatus.${repayment.status}`)}
          tone={SCHEDULE_STATUS_TONE[repayment.status] ?? 'neutral'}
        />
      </View>

      <MetricPanel
        className="mt-3"
        items={[
          { label: t('loans.detail.outstanding'), value: formatCurrency(repayment.outstanding) },
          { label: t('loans.nextPayment'), value: formatCurrency(repayment.nextPayment) },
          { label: t('loans.detail.totalDue'), value: formatCurrency(repayment.totalDue) },
        ]}
      />
    </View>
  );
}
