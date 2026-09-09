import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { StatusPill } from '@/components/ui/status-pill';
import { formatCurrency } from '@/lib/format';
import { useTheme } from '@/theme/theme-provider';

const STATUS = {
  'due-today': { key: 'dueToday', tone: 'warning' },
  overdue: { key: 'overdue', tone: 'danger' },
  upcoming: { key: 'upcoming', tone: 'info' },
};

export function TaskCard({ task, onPressView }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const status = STATUS[task.status] ?? STATUS.upcoming;

  return (
    <View className="mb-3 flex-row rounded-xl border border-line bg-card p-4">
      <View className="flex-1">
        <Text className="text-[15px] font-semibold text-ink">{task.customerName}</Text>
        <Text className="mt-1 text-xs text-ink-muted">{task.kind}</Text>
        <Text className="mt-1.5 text-[13px] font-semibold text-primary">
          {formatCurrency(task.amount)}
        </Text>
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
