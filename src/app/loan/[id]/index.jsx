import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getLoanById } from '@/api/mock';
import { AppHeader, NotificationsAction } from '@/components/layout/app-header';
import { RepaymentCard } from '@/components/loans/repayment-card';
import { ActivityList } from '@/components/ui/activity-list';
import { BalancePanel } from '@/components/ui/balance-panel';
import { Button } from '@/components/ui/button';
import { DetailRows } from '@/components/ui/detail-rows';
import { EmptyState } from '@/components/ui/empty-state';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { StatusPill } from '@/components/ui/status-pill';
import { formatCurrency } from '@/lib/format';
import { LOAN_STATUS_TONE } from '@/lib/status';
import { useTheme } from '@/theme/theme-provider';

const TABS = ['overview', 'repayment', 'activity'];

export default function LoanDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const [tab, setTab] = useState('overview');

  const loan = useMemo(() => getLoanById(id), [id]);

  if (!loan) {
    return (
      <View className="flex-1 bg-background">
        <AppHeader showBack title={t('loans.detail.notFound')} />
        <EmptyState icon="cash-outline" title={t('loans.detail.notFound')} />
      </View>
    );
  }

  const tabOptions = TABS.map((value) => ({
    value,
    label: t(`loans.detail.tabs.${value}`),
  }));

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        showBack
        title={loan.product}
        subtitle={`${loan.reference} \u00b7 ${loan.customerName}`}
        right={<NotificationsAction />}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-4 pt-4">
          <BalancePanel
            label={t('loans.detail.outstandingBalance')}
            value={formatCurrency(loan.outstanding)}
            footerLeft={t('loans.detail.next', { amount: formatCurrency(loan.nextPayment) })}
            footerRight={t('loans.detail.due', { date: loan.dueDate })}
          />

          <SegmentedTabs options={tabOptions} value={tab} onChange={setTab} className="my-4" />

          {tab === 'overview' ? <OverviewTab loan={loan} /> : null}
          {tab === 'repayment' ? <RepaymentTab loan={loan} /> : null}
          {tab === 'activity' ? <ActivityTab loan={loan} /> : null}
        </View>
      </ScrollView>

      <View className="border-t border-line bg-card px-4 pb-6 pt-3">
        <Button label={t('loans.detail.recordPayment')} icon="send" size="lg" onPress={() => {}} />
      </View>
    </View>
  );
}

function OverviewTab({ loan }) {
  const { t } = useTranslation();

  const rows = [
    { key: 'id', label: t('loans.detail.loanId'), value: loan.reference },
    { key: 'customer', label: t('loans.detail.customer'), value: loan.customerName, tone: 'link' },
    { key: 'product', label: t('loans.detail.loanProduct'), value: loan.product },
    { key: 'principal', label: t('loans.detail.principal'), value: formatCurrency(loan.principal) },
    {
      key: 'outstanding',
      label: t('loans.detail.outstanding'),
      value: formatCurrency(loan.outstanding),
    },
    { key: 'rate', label: t('loans.detail.interestRate'), value: loan.interestRate },
    {
      key: 'tenure',
      label: t('loans.detail.tenure'),
      value: t('loans.detail.tenureValue', { count: loan.tenureMonths }),
    },
    {
      key: 'monthly',
      label: t('loans.detail.monthlyRepayment'),
      value: formatCurrency(loan.nextPayment),
    },
    { key: 'nextDue', label: t('loans.detail.nextDueDate'), value: loan.dueDate },
    { key: 'maturity', label: t('loans.detail.maturityDate'), value: loan.maturityDate },
    {
      key: 'status',
      label: t('loans.detail.statusLabel'),
      value: (
        <StatusPill
          label={t(`loans.status.${loan.status}`)}
          tone={LOAN_STATUS_TONE[loan.status] ?? 'neutral'}
        />
      ),
    },
  ];

  return <DetailRows rows={rows} />;
}

function RepaymentTab({ loan }) {
  const { t } = useTranslation();

  if (loan.repayments.length === 0) {
    return <EmptyState icon="calendar-outline" title={t('loans.detail.noRepayments')} />;
  }

  return loan.repayments.map((repayment) => (
    <RepaymentCard key={repayment.id} repayment={repayment} />
  ));
}

function ActivityTab({ loan }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (loan.activity.length === 0) {
    return <EmptyState icon="time-outline" title={t('loans.detail.noActivity')} />;
  }

  const entries = loan.activity.map((entry) => ({
    id: entry.id,
    icon: <Ionicons name="checkmark-circle-outline" size={19} color={colors.ink} />,
    title: t('loans.detail.repaymentRecorded'),
    detail: t('loans.detail.received', { amount: formatCurrency(entry.amount) }),
    timestamp: entry.date,
  }));

  return <ActivityList entries={entries} />;
}
