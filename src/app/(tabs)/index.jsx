import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { DetailsModal } from '@/components/ui/details-modal';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { MetricPanel } from '@/components/ui/metric-panel';
import { SectionHeading } from '@/components/ui/section-heading';
import { StatCard } from '@/components/ui/stat-card';
import { agentView } from '@/lib/agent';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatCurrencyPrecise,
  formatDate,
  formatDateTime,
  greetingKey,
  isCompactCurrency,
} from '@/lib/format';
import { navigateTo } from '@/lib/navigate';
import { usePermission, useRefreshWithPermissions } from '@/providers/permission-provider';
import { useAuth } from '@/providers/auth-provider';

/** Home shows a preview of the repayment list; the rest lives behind "See all". */
const TASK_PREVIEW = 3;

const DOT = '·';

/** Movement status -> a `ui/details-modal` tone. Declined and Reversed are failures. */
const MOVEMENT_TONE = {
  posted: 'success',
  successful: 'success',
  completed: 'success',
  pending: 'warning',
  declined: 'danger',
  reversed: 'danger',
  failed: 'danger',
};
const EMDASH = '—';

export default function HomeScreen() {
  const { t } = useTranslation();
  const customers = usePermission(Permission.customerManagement);
  const deposit = usePermission(Permission.deposit);
  const ajo = usePermission(Permission.ajo);
  const loans = usePermission(Permission.loanCollection);
  const agent = agentView(useAuth().user);
  // A movement carries seven fields; a row shows three lines of them.
  const [openMovement, setOpenMovement] = useState(null);
  // A figure too long for its tile is shown shortened ("₦499.90B"); this holds
  // the one whose exact amount the agent asked to see.
  const [openAmount, setOpenAmount] = useState(null);

  /**
   * Props for a figure that may not fit its tile: the shortened text, plus a
   * tap that opens the exact amount — but ONLY when it was actually shortened,
   * so a tile reading ₦0 is not pretending to have more to show.
   */
  const amountProps = (label, amount) => ({
    value: formatCurrencyCompact(amount),
    onPress: isCompactCurrency(amount) ? () => setOpenAmount({ label, amount }) : undefined,
    pressLabel: isCompactCurrency(amount) ? t('dashboard.amount.press', { label }) : undefined,
  });

  const { data, isPending, isError, error, refetch, isRefetching } = useQuery(dashboardQuery);

  // Pulling to refresh on the home screen re-asks what this agent may do, so a
  // permission an administrator just changed takes effect without restarting.
  const onRefresh = useRefreshWithPermissions(refetch);

  // The three cash figures are shown ALWAYS, each as a dash when the server
  // sends no value — so it is visible whether the backend is returning the
  // field at all (a dash) versus a real number. `availableCash` (the spendable
  // limit) and `awaitingRemittance` (cash remitted but not yet approved) are
  // newer fields this gateway does not return yet; they read as "—" until it
  // does. `cashInHand`/`availableCash` are also null for an agent with no till
  // — same dash. A tap on a shortened figure opens its exact value (amountProps
  // only attaches that when there IS a value to open).
  const cashTile = (label, amount) => ({
    label,
    ...(amount == null ? { value: EMDASH } : amountProps(label, amount)),
  });

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
            {/* A work-blocking condition stays on screen, unlike a toast. It opens
                Remit cash: a hold means the agent is holding cash they need to
                hand back to the branch before the day can reconcile, and that is
                the action they came to the banner to take. End of day is still
                one tap away under "Today's money" for the balanced-count case. */}
            {data.reconciliationHold ? (
              <View className="-mt-8 px-4 pb-4">
                <AlertBanner
                  title={t('dashboard.hold.title')}
                  message={data.holdReason ?? t('dashboard.hold.message')}
                  actionLabel={t('dashboard.hold.action')}
                  onPress={() => navigateTo('/remittance')}
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
                  tone="bg-tile-4"
                  {...amountProps(t('dashboard.stats.collections'), data.collectionsTotal ?? 0)}
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

              {/* Available cash, the ledger balance, and cash awaiting branch
                  confirmation — always shown. A field the server does not send
                  (availableCash / awaitingRemittance are not live yet) reads
                  "—", so it is clear whether the backend is returning it. */}
              <MetricPanel
                className="mt-3"
                items={[
                  cashTile(t('dashboard.today.availableCash'), data.availableCash),
                  cashTile(t('dashboard.today.ledger'), data.cashInHand),
                  cashTile(t('dashboard.today.awaitingShort'), data.awaitingRemittance),
                ]}
              />

              {/* What an agent does with the cash in hand, right under the
                  figure they act on.

                  EOD-DISABLED — End of day sat beside this at half width.
                  With it gone Remit cash takes the row on its own rather than
                  leaving a hole, so restoring the pair means uncommenting the
                  button below AND putting `flex-1` back on this one.
              <Button
                className="flex-1"
                variant="outline"
                icon="calculator-outline"
                label={t('dashboard.today.endOfDay')}
                onPress={() => navigateTo('/eod')}
              />
              */}
              <View className="mt-3 flex-row gap-3">
                <Button
                  className="flex-1"
                  variant="outline"
                  size="lg"
                  icon="arrow-up-circle-outline"
                  label={t('dashboard.today.remit')}
                  onPress={() => navigateTo('/remittance')}
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
                onPressAction={loans.press(() => navigateTo('/(tabs)/loans'))}
              />

              {/* `todaysTasks` is the server's name, but every entry is a loan
                  repayment — { loanCode, customerName, amount, dueDate,
                  dueStatus } and nothing else — and on live data they are
                  mostly OVERDUE, from months back. "Today's tasks" promised
                  something this list is not. */}
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
                    onPressView={loans.press(() => navigateTo(`/loan/${task.loanCode}`))}
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
                    onPress: () => setOpenMovement(entry),
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

      {/* The whole movement: the reference an agent reads out to support, and
          the status, which the row shows only when there is no narration. */}
      <DetailsModal
        visible={openMovement !== null}
        title={t('dashboard.activity.movement')}
        subtitle={openMovement?.capturedAt ? formatDateTime(openMovement.capturedAt) : undefined}
        rows={openMovement ? movementRows(t, openMovement) : []}
        onClose={() => setOpenMovement(null)}
      />

      {/* The exact figure behind a shortened one. Precise, to the kobo — the
          whole point of opening it is that "₦499.90B" is an approximation. */}
      <DetailsModal
        visible={openAmount !== null}
        title={openAmount?.label ?? ''}
        subtitle={t('dashboard.amount.subtitle')}
        rows={
          openAmount
            ? [
                {
                  key: 'exact',
                  label: t('dashboard.amount.exact'),
                  value: formatCurrencyPrecise(openAmount.amount),
                },
              ]
            : []
        }
        onClose={() => setOpenAmount(null)}
      />
    </View>
  );
}

/** Every field the server sends for a movement; a missing one reads as a dash. */
function movementRows(t, movement) {
  return [
    { key: 'amount', label: t('dashboard.activity.amount'), value: formatCurrency(movement.amount) },
    {
      key: 'status',
      label: t('dashboard.activity.status'),
      value: movement.status || EMDASH,
      tone: MOVEMENT_TONE[String(movement.status ?? '').toLowerCase()],
    },
    {
      key: 'customer',
      label: t('dashboard.activity.customer'),
      value: movement.customerName || EMDASH,
    },
    {
      key: 'account',
      label: t('dashboard.activity.account'),
      value: movement.accountNumber || EMDASH,
    },
    {
      key: 'narration',
      label: t('dashboard.activity.narration'),
      value: movement.narration || EMDASH,
    },
    {
      key: 'txn',
      label: t('dashboard.activity.transactionId'),
      value: movement.transactionId || EMDASH,
    },
    {
      key: 'when',
      label: t('dashboard.activity.dateTime'),
      value: movement.capturedAt ? formatDateTime(movement.capturedAt) : EMDASH,
    },
  ];
}
