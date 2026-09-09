import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MetricPanel } from '@/components/ui/metric-panel';
import { StatusPill } from '@/components/ui/status-pill';
import { formatCurrency } from '@/lib/format';
import { LOAN_STATUS_TONE } from '@/lib/status';
import { useTheme } from '@/theme/theme-provider';

/**
 * A loan in a list: who it belongs to, the two figures that matter, and when
 * the next payment lands.
 *
 * Not built on ListCard — the metric strip spans the full card width and sits
 * under the status pill, which ListCard's column layout can't express. Forcing
 * it in would have meant a variant prop that changes the layout wholesale,
 * which is the thing that makes a shared component stop being shared.
 */
export function LoanCard({ loan, onPress }) {
  const { t } = useTranslation();
  const { shadows } = useTheme();

  const Container = onPress ? Pressable : View;

  return (
    <Container
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `${loan.customerName} ${loan.reference}` : undefined}
      onPress={onPress}
      style={shadows.sm}
      className={`mb-3 rounded-xl border border-line bg-card p-4 ${
        onPress ? 'active:bg-card-muted' : ''
      }`}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-[16px] font-bold text-ink" numberOfLines={1}>
            {loan.customerName}
          </Text>
          <Text className="mt-0.5 text-[13px] text-ink-muted" numberOfLines={1}>
            {loan.product} {loan.reference}
          </Text>
        </View>

        <StatusPill
          label={t(`loans.status.${loan.status}`)}
          tone={LOAN_STATUS_TONE[loan.status] ?? 'neutral'}
        />
      </View>

      <MetricPanel
        className="mt-3"
        items={[
          { label: t('loans.outstanding'), value: formatCurrency(loan.outstanding) },
          { label: t('loans.nextPayment'), value: formatCurrency(loan.nextPayment) },
        ]}
      />

      <Text className="mt-3 text-[13px] text-ink-muted">
        {t('loans.dueDate', { date: loan.dueDate })}
      </Text>
    </Container>
  );
}
