import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getAgent } from '@/api/mock';
import { ActivityList } from '@/components/ui/activity-list';
import { QuickAction } from '@/components/dashboard/quick-action';
import { SectionHeading } from '@/components/ui/section-heading';
import { StatCard } from '@/components/ui/stat-card';
import { TaskCard } from '@/components/dashboard/task-card';
import { AppHeader, HeaderAction, HeaderAvatar } from '@/components/layout/app-header';
import { formatCurrencyCompact, greetingKey } from '@/lib/format';
import { navigateTo } from '@/lib/navigate';

// TODO: replace with the dashboard endpoint once it exists.
const SUMMARY = { customers: 248, accounts: 312, activeLoans: 86, collections: 4_500_000 };

const TASKS = [
  { id: 't1', customerName: 'Adebayo Musa', amount: 42850, status: 'due-today' },
  { id: 't2', customerName: 'Adebayo Musa', amount: 42850, status: 'overdue' },
  { id: 't3', customerName: 'Adebayo Musa', amount: 42850, status: 'due-today' },
];

const ACTIVITY = [
  { id: 'a1', title: 'Customer assigned', detail: 'Grace Eze (CUS-00129)', timestamp: 'Today, 08:15' },
  {
    id: 'a2',
    title: 'Repayment recorded',
    detail: '\u20A641,850 · LN-00125',
    timestamp: 'Yesterday, 16:42',
  },
  {
    id: 'a3',
    title: 'Support ticket updated',
    detail: 'TCK-0412 moved to In Progress',
    timestamp: 'Yesterday, 11:05',
  },
  {
    id: 'a4',
    title: 'Loan assigned',
    detail: 'SME Working Capital · LN-00127',
    timestamp: '09 Aug 2026',
  },
];

export default function HomeScreen() {
  const { t } = useTranslation();

  // One agent record for the whole app — see src/api/mock.js.
  const agent = getAgent();

  return (
    <View className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* `overlap` leaves room for the tiles below to pull up over the banner. */}
        <AppHeader
          overlap
          leading={<HeaderAvatar name={agent.name} uri={agent.avatarUrl} />}
          title={t(`dashboard.greeting.${greetingKey()}`, { name: agent.firstName })}
          subtitle={t('dashboard.agentId', { code: agent.code })}
          right={
            <HeaderAction
              icon="notifications-outline"
              accessibilityLabel={t('common.notifications')}
              onPress={() => navigateTo('/(tabs)/support')}
            />
          }
        />

        <View className="-mt-12 gap-3 px-4">
          <View className="flex-row gap-3">
            <StatCard
              label={t('dashboard.stats.customers')}
              value={String(SUMMARY.customers)}
              tone="bg-tile-1"
            />
            <StatCard
              label={t('dashboard.stats.accounts')}
              value={String(SUMMARY.accounts)}
              tone="bg-tile-2"
            />
          </View>
          <View className="flex-row gap-3">
            <StatCard
              label={t('dashboard.stats.activeLoans')}
              value={String(SUMMARY.activeLoans)}
              tone="bg-tile-3"
            />
            <StatCard
              label={t('dashboard.stats.collections')}
              value={formatCurrencyCompact(SUMMARY.collections)}
              tone="bg-tile-4"
            />
          </View>
        </View>

        <View className="mt-7 px-4">
          <SectionHeading
            title={t('dashboard.quickActions.title')}
            actionLabel={t('dashboard.quickActions.all')}
            actionAsPill
            onPressAction={() => navigateTo('/collections')}
          />
          <View className="flex-row gap-3">
            <QuickAction
              label={t('dashboard.quickActions.customers')}
              icon="people-outline"
              onPress={() => navigateTo('/(tabs)/customers')}
            />
            <QuickAction
              label={t('dashboard.quickActions.deposit')}
              icon="card-outline"
              onPress={() => navigateTo('/deposit/customer')}
            />
            <QuickAction label={t('dashboard.quickActions.ajo')} icon="albums-outline" />
            <QuickAction
              label={t('dashboard.quickActions.loan')}
              icon="cash-outline"
              onPress={() => navigateTo('/(tabs)/loans')}
            />
          </View>
        </View>

        <View className="mt-7 px-4">
          <SectionHeading
            title={t('dashboard.tasks.title')}
            actionLabel={t('dashboard.tasks.seeAll')}
          />
          {TASKS.map((task) => (
            <TaskCard key={task.id} task={{ ...task, kind: t('dashboard.tasks.loanRepayment') }} />
          ))}
        </View>

        <View className="mt-4 px-4">
          <SectionHeading title={t('dashboard.activity.title')} />
          <ActivityList entries={ACTIVITY} />
        </View>
      </ScrollView>
    </View>
  );
}
