import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { loanActivityQuery, loanOverviewQuery, loanScheduleQuery } from '@/api/loans';
import { AppHeader } from '@/components/layout/app-header';
import { RepaymentCard } from '@/components/loans/repayment-card';
import { ActivityList } from '@/components/ui/activity-list';
import { BalancePanel } from '@/components/ui/balance-panel';
// import { Button } from '@/components/ui/button';  // see the commented Record Payment block
import { DetailRows } from '@/components/ui/detail-rows';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
// import { navigateTo } from '@/lib/navigate';  // see the commented Record Payment block
import { LOAN_STATUS_TONE } from '@/lib/status';

const TABS = ['overview', 'repayment', 'activity'];

/** Statuses arrive in core banking's casing ("OVERDUE", "Performing"). */
const toneFor = (status) => LOAN_STATUS_TONE[String(status ?? '').toLowerCase()] ?? 'neutral';

/**
 * The term is two fields: `tenure` (6) and `tenureType` ("Weekly"). Joined raw
 * that reads "6 Weekly", so the type becomes a unit. An unrecognised type is
 * shown as the server sent it rather than dropped.
 */
const TENURE_UNITS = { daily: 'days', weekly: 'weeks', monthly: 'months', yearly: 'years' };

function tenureLabel(t, tenure, tenureType) {
  if (tenure == null) return null;
  const unit = TENURE_UNITS[String(tenureType ?? '').toLowerCase()];
  return unit ? `${tenure} ${t(`loans.detail.units.${unit}`)}` : `${tenure} ${tenureType ?? ''}`.trim();
}

export default function LoanDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const [tab, setTab] = useState('overview');

  const loanCode = String(id ?? '');
  const overview = useQuery(loanOverviewQuery(loanCode));
  const loan = overview.data;

  const tabOptions = TABS.map((value) => ({
    value,
    label: t(`loans.detail.tabs.${value}`),
  }));

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        showBack
        title={loan?.product ?? t('loans.detail.title')}
        subtitle={[loan?.loanCode ?? loanCode, loan?.customerName].filter(Boolean).join(' · ')}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-4 pt-4">
          {overview.isPending ? (
            <View className="rounded-2xl bg-card-muted px-5 py-4">
              <Skeleton width="35%" height={12} />
              <Skeleton width="55%" height={26} style={{ marginTop: 10 }} />
              <Skeleton width="80%" height={12} style={{ marginTop: 12 }} />
            </View>
          ) : overview.isError ? (
            <ErrorState error={overview.error} onRetry={overview.refetch} compact />
          ) : (
            <BalancePanel
              label={t('loans.detail.outstandingBalance')}
              value={formatCurrency(loan.outstanding ?? 0)}
              footerLeft={t('loans.detail.next', {
                amount: formatCurrency(loan.nextPaymentAmount ?? 0),
              })}
              footerRight={
                loan.nextDueDate ? t('loans.detail.due', { date: formatDate(loan.nextDueDate) }) : ''
              }
            />
          )}
        </View>

        {loan ? (
          <>
            <View className="px-4">
              <SegmentedTabs options={tabOptions} value={tab} onChange={setTab} className="my-4" />
            </View>

            <View className="px-4">
              {tab === 'overview' ? <OverviewTab loan={loan} tenureText={tenureLabel(t, loan.tenure, loan.tenureType)} /> : null}
              {tab === 'repayment' ? <RepaymentTab loanCode={loanCode} /> : null}
              {tab === 'activity' ? <ActivityTab loanCode={loanCode} /> : null}
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* Record Payment is commented out, NOT deleted: the designer is removing
          it from this screen, and there is no loan-repayment endpoint anyway —
          it was routing into the deposit flow, which posts to a savings account
          rather than reducing a loan. Restore this block only alongside a real
          POST /agent/loans/{loanCode}/repayments.

      {loan ? (
        <View className="border-t border-line bg-card px-4 pb-6 pt-3">
          <Button
            label={t('loans.detail.recordPayment')}
            icon="send"
            size="lg"
            onPress={() => navigateTo('/deposit/customer')}
          />
        </View>
      ) : null}
      */}
    </View>
  );
}

function OverviewTab({ loan, tenureText }) {
  const { t } = useTranslation();

  const rows = [
    // The one value an agent reads out to support or types elsewhere.
    { key: 'id', label: t('loans.detail.loanId'), value: loan.loanCode, copyable: true },
    { key: 'customer', label: t('loans.detail.customer'), value: loan.customerName, tone: 'link' },
    { key: 'product', label: t('loans.detail.loanProduct'), value: loan.product },
    { key: 'principal', label: t('loans.detail.principal'), value: formatCurrency(loan.principal ?? 0) },
    {
      key: 'outstanding',
      label: t('loans.detail.outstanding'),
      value: formatCurrency(loan.outstanding ?? 0),
    },
    // A number from the server (10), not a formatted string.
    {
      key: 'rate',
      label: t('loans.detail.interestRate'),
      value: loan.interestRate == null ? '' : `${loan.interestRate}%`,
    },
    ...(tenureText ? [{ key: 'tenure', label: t('loans.detail.tenure'), value: tenureText }] : []),
    {
      key: 'repayment',
      label: t('loans.detail.monthlyRepayment'),
      value: formatCurrency(loan.monthlyRepayment ?? 0),
    },
    {
      key: 'nextDue',
      label: t('loans.detail.nextDueDate'),
      value: loan.nextDueDate ? formatDate(loan.nextDueDate) : '',
    },
    {
      key: 'maturity',
      label: t('loans.detail.maturityDate'),
      value: loan.maturityDate ? formatDate(loan.maturityDate) : '',
    },
    {
      key: 'status',
      label: t('loans.detail.statusLabel'),
      value: <StatusPill label={loan.status} tone={toneFor(loan.status)} />,
    },
  ];

  return <DetailRows rows={rows} />;
}

/** Loading / failed / empty, shared by the tabs that fetch their own list. */
function TabState({ query, emptyIcon, emptyTitle, emptyMessage, children }) {
  if (query.isPending) {
    return (
      <View>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} lines={4} />
        ))}
      </View>
    );
  }

  if (query.isError) {
    return <ErrorState error={query.error} onRetry={query.refetch} compact />;
  }

  if (!query.data?.length) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />;
  }

  return children;
}

function RepaymentTab({ loanCode }) {
  const { t } = useTranslation();
  const query = useQuery(loanScheduleQuery(loanCode));

  return (
    <TabState
      query={query}
      emptyIcon="calendar-outline"
      emptyTitle={t('loans.detail.noRepayments')}
      emptyMessage={t('loans.detail.noRepaymentsMessage')}>
      <View>
        {query.data?.map((row, index) => (
          // The schedule has no id, and two instalments can share a due date.
          <RepaymentCard key={`${row.dueDate}-${index}`} repayment={row} />
        ))}
      </View>
    </TabState>
  );
}

function ActivityTab({ loanCode }) {
  const { t } = useTranslation();
  const query = useQuery(loanActivityQuery(loanCode));

  return (
    <TabState
      query={query}
      emptyIcon="time-outline"
      emptyTitle={t('loans.detail.noActivity')}
      emptyMessage={t('loans.detail.noActivityMessage')}>
      <ActivityList
        entries={(query.data ?? []).map((entry, index) => ({
          id: `${entry.occurredAt}-${index}`,
          title: entry.title,
          // Already formatted by the server; don't rebuild it.
          detail: entry.detail,
          timestamp: formatDateTime(entry.occurredAt),
        }))}
      />
    </TabState>
  );
}
