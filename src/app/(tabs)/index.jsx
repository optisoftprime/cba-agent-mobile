import { useQuery } from '@tanstack/react-query';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { dashboardQuery } from '@/api/dashboard';
import { Permission } from '@/api/permissions';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { QuickAction } from '@/components/dashboard/quick-action';
import { TaskCard } from '@/components/dashboard/task-card';
import { AppHeader, HeaderAvatar, NotificationsAction } from '@/components/layout/app-header';
import { ActivityList } from '@/components/ui/activity-list';
import { AlertBanner } from '@/components/ui/alert-banner';
import { BalancePanel } from '@/components/ui/balance-panel';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { MetricPanel } from '@/components/ui/metric-panel';
import { SectionHeading } from '@/components/ui/section-heading';
import { StatCard } from '@/components/ui/stat-card';
import { agentView } from '@/lib/agent';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatDateTime,
  greetingKey,
} from '@/lib/format';
import { navigateTo } from '@/lib/navigate';
import { usePermission, useRefreshWithPermissions } from '@/providers/permission-provider';
import { useAuth } from '@/providers/auth-provider';

/** Home shows a preview of the task list; the rest lives behind "See all". */
const TASK_PREVIEW = 3;

const DOT = '·';
const EMDASH = '—';

export default function HomeScreen() {
  const { t } = useTranslation();
  const customers = usePermission(Permission.customerManagement);
  const deposit = usePermission(Permission.deposit);
  const ajo = usePermission(Permission.ajo);
  const loans = usePermission(Permission.loanCollection);
  const agent = agentView(useAuth().user);

  const { data, isPending, isError, error, refetch, isRefetching } = useQuery(dashboardQuery);

  // Pulling to refresh on the home screen re-asks what this agent may do, so a
  // permission an administrator just changed takes effect without restarting.
  const onRefresh = useRefreshWithPermissions(refetch);

  // Branch and business date ride along with the agent code: an agent posting
  // cash needs to know which book day the server has them on.
  const headerSubtitle = [
    agent?.code,
    data?.branchName,
    data?.businessDate && formatDate(data.businessDate),
  ]
    .filter(Boolean)
    .join(` ${DOT} `);

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching && !isPending} onRefresh={onRefresh} />
        }>
        {/* `overlap` leaves room for the tiles below to pull up over the banner. */}
        <AppHeader
          overlap
          leading={<HeaderAvatar name={agent?.name} />}
          title={t(`dashboard.greeting.${greetingKey()}`, { name: agent?.firstName ?? '' })}
          subtitle={headerSubtitle}
          right={<NotificationsAction count={data?.unreadNotifications} />}
        />

        {isPending ? <DashboardSkeleton /> : null}

        {isError ? (
          <View className="-mt-8 pt-6">
            <ErrorState error={error} onRetry={refetch} />
          </View>
        ) : null}

        {data ? (
          <>
            {/* A work-blocking condition stays on screen, unlike a toast. */}
            {data.reconciliationHold ? (
              <View className="-mt-8 px-4 pb-4">
                <AlertBanner
                  title={t('dashboard.hold.title')}
                  message={data.holdReason ?? t('dashboard.hold.message')}
                />
              </View>
            ) : null}

            <View className={`${data.reconciliationHold ? '' : '-mt-12'} gap-3 px-4`}>
              <View className="flex-row gap-3">
                <StatCard
                  label={t('dashboard.stats.customers')}
                  value={String(data.customerCount ?? 0)}
                  tone="bg-tile-1"
                />
                <StatCard
                  label={t('dashboard.stats.accounts')}
                  value={String(data.accountCount ?? 0)}
                  tone="bg-tile-2"
                />
              </View>
              <View className="flex-row gap-3">
                <StatCard
                  label={t('dashboard.stats.activeLoans')}
                  value={String(data.activeLoans ?? 0)}
                  tone="bg-tile-3"
                />
                <StatCard
                  label={t('dashboard.stats.collections')}
                  value={formatCurrencyCompact(data.collectionsTotal ?? 0)}
                  tone="bg-tile-4"
                />
              </View>
            </View>

            {/* Today's money — what an agent in the field is actually tracking. */}
            <View className="mt-7 px-4">
              <BalancePanel
                label={t('dashboard.today.collected')}
                value={formatCurrency(data.collectedToday ?? 0)}
                footerLeft={t('dashboard.today.pending', {
                  amount: formatCurrency(data.pendingToday ?? 0),
                })}
                footerRight={t('dashboard.today.transactions', {
                  count: data.transactionsToday ?? 0,
                })}
              />

              <MetricPanel
                className="mt-3"
                items={[
                  {
                    label: t('dashboard.today.cashInHand'),
                    // null means the server has no figure, which is not zero naira.
                    value: data.cashInHand == null ? EMDASH : formatCurrency(data.cashInHand),
                  },
                  {
                    label: t('dashboard.today.pendingShort'),
                    value: formatCurrency(data.pendingToday ?? 0),
                  },
                  {
                    label: t('dashboard.today.transactionsShort'),
                    value: String(data.transactionsToday ?? 0),
                  },
                ]}
              />
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
                  className={customers.lockedClass}
                  onPress={customers.press(() => navigateTo('/(tabs)/customers'))}
                />
                <QuickAction
                  label={t('dashboard.quickActions.deposit')}
                  icon="card-outline"
                  className={deposit.lockedClass}
                  onPress={deposit.press(() => navigateTo('/deposit/customer'))}
                />
                <QuickAction
                  label={t('dashboard.quickActions.ajo')}
                  icon="albums-outline"
                  className={ajo.lockedClass}
                  onPress={ajo.press(() => navigateTo('/ajo'))}
                />
                <QuickAction
                  label={t('dashboard.quickActions.loan')}
                  icon="cash-outline"
                  className={loans.lockedClass}
                  onPress={loans.press(() => navigateTo('/(tabs)/loans'))}
                />
              </View>
            </View>

            <View className="mt-7 px-4">
              <SectionHeading
                title={t('dashboard.tasks.title')}
                actionLabel={
                  data.todaysTasks?.length > TASK_PREVIEW
                    ? t('dashboard.tasks.seeAllCount', { count: data.todaysTasks.length })
                    : undefined
                }
                onPressAction={() => navigateTo('/(tabs)/loans')}
              />

              {data.todaysTasks?.length ? (
                data.todaysTasks.slice(0, TASK_PREVIEW).map((task) => (
                  // loanCode repeats across due dates, so it can't key a row alone.
                  <TaskCard
                    key={`${task.loanCode}-${task.dueDate}`}
                    task={{
                      customerName: task.customerName,
                      kind: task.loanCode,
                      amount: task.amount,
                      dueDate: task.dueDate,
                      status: task.dueStatus,
                    }}
                    onPressView={() => navigateTo(`/loan/${task.loanCode}`)}
                  />
                ))
              ) : (
                <EmptyState
                  compact
                  icon="checkmark-done-outline"
                  title={t('dashboard.tasks.empty')}
                  message={t('dashboard.tasks.emptyMessage')}
                />
              )}
            </View>

            <View className="mt-4 px-4">
              <SectionHeading title={t('dashboard.activity.title')} />

              {data.recentActivity?.length ? (
                <ActivityList
                  entries={data.recentActivity.map((entry) => ({
                    id: entry.transactionId,
                    title: entry.narration || entry.status,
                    detail: [formatCurrency(entry.amount), entry.customerName, entry.accountNumber]
                      .filter(Boolean)
                      .join(` ${DOT} `),
                    timestamp: formatDateTime(entry.capturedAt),
                  }))}
                />
              ) : (
                <EmptyState
                  compact
                  icon="time-outline"
                  title={t('dashboard.activity.empty')}
                  message={t('dashboard.activity.emptyMessage')}
                />
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
