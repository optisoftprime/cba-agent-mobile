import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { StatusPill } from '@/components/ui/status-pill';
import { formatCurrency, formatDate } from '@/lib/format';
import { useTheme } from '@/theme/theme-provider';

/**
 * The server's `dueStatus`, upper-cased, mapped to wording and a colour. Live
 * data only ever showed OVERDUE, so unknown values fall back to `upcoming`
 * rather than rendering a raw enum at the agent.
 */
const STATUS = {
  OVERDUE: { key: 'overdue', tone: 'danger' },
  DUE: { key: 'dueToday', tone: 'warning' },
  DUE_TODAY: { key: 'dueToday', tone: 'warning' },
  UPCOMING: { key: 'upcoming', tone: 'info' },
  PENDING: { key: 'upcoming', tone: 'info' },
};

export function TaskCard({ task, onPressView }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const status = STATUS[String(task.status).toUpperCase()] ?? STATUS.UPCOMING;

  return (
    <View className="mb-3 flex-row rounded-xl border border-line bg-card p-4">
      <View className="flex-1">
        <Text className="text-[15px] font-semibold text-ink">{task.customerName}</Text>
        <Text className="mt-1 text-xs text-ink-muted">{task.kind}</Text>
        <Text className="mt-1.5 text-[13px] font-semibold text-primary">
          {formatCurrency(task.amount)}
        </Text>
        {task.dueDate ? (
          <Text className="mt-1 text-[11px] text-ink-soft">
            {t('dashboard.tasks.due', { date: formatDate(task.dueDate) })}
          </Text>
        ) : null}
      </View>

      <View className="items-end justify-between">
        <StatusPill label={t(`dashboard.tasks.status.${status.key}`)} tone={status.tone} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('dashboard.tasks.view')} ${task.customerName}`}
          onPress={onPressView}
          hitSlop={8}
          className="flex-row items-center gap-1">
          <Text className="text-[13px] font-medium text-primary">{t('dashboard.tasks.view')}</Text>
          <Ionicons name="arrow-forward" size={13} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}
