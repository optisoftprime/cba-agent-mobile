import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getCustomerById } from '@/api/mock';
import { AppHeader, NotificationsAction } from '@/components/layout/app-header';
import { ActivityList } from '@/components/ui/activity-list';
import { Avatar } from '@/components/ui/avatar';
import { DetailRows } from '@/components/ui/detail-rows';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterChips } from '@/components/ui/filter-chips';
import { ListCard } from '@/components/ui/list-card';
import { StatCard } from '@/components/ui/stat-card';
import { formatCurrency } from '@/lib/format';
import { navigateTo } from '@/lib/navigate';
import { ACCOUNT_STATUS_TONE, CUSTOMER_STATUS_TONE, LOAN_STATUS_TONE } from '@/lib/status';

const TABS = ['overview', 'account', 'loans', 'activity'];

export default function CustomerDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const [tab, setTab] = useState('overview');

  const customer = useMemo(() => getCustomerById(id), [id]);

  if (!customer) {
    return (
      <View className="flex-1 bg-background">
        <AppHeader showBack title={t('customers.detail.notFound')} />
        <EmptyState icon="person-outline" title={t('customers.detail.notFound')} />
      </View>
    );
  }

  const statusPill = {
    label: t(`customers.status.${customer.status}`),
    tone: CUSTOMER_STATUS_TONE[customer.status] ?? 'neutral',
  };

  const tabOptions = TABS.map((value) => ({
    value,
    label: t(`customers.detail.tabs.${value}`),
  }));

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        showBack
        title={customer.name}
        subtitle={customer.code}
        right={<NotificationsAction />}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Same ListCard as every list row — just with no chevron. */}
        <View className="px-4 pt-4">
          <ListCard
            leading={<Avatar name={customer.name} />}
            title={customer.name}
            subtitle={`${t(`customers.type.${customer.type}`)} · ${customer.code}`}
            status={statusPill}
            trailing={null}
          />
        </View>

        <FilterChips options={tabOptions} value={tab} onChange={setTab} className="mb-4" />

        <View className="px-4">
          {tab === 'overview' ? <OverviewTab customer={customer} /> : null}
          {tab === 'account' ? <AccountsTab customer={customer} /> : null}
          {tab === 'loans' ? <LoansTab customer={customer} /> : null}
          {tab === 'activity' ? <ActivityTab customer={customer} /> : null}
        </View>
      </ScrollView>
    </View>
  );
}

function OverviewTab({ customer }) {
  const { t } = useTranslation();
  const loan = customer.loans[0];

  const rows = [
    { key: 'customer', label: t('customers.detail.customer'), value: customer.name, tone: 'link' },
    loan && { key: 'product', label: t('customers.detail.loanProduct'), value: loan.product },
    loan && {
      key: 'principal',
      label: t('customers.detail.principal'),
      value: formatCurrency(loan.principal),
    },
    loan && {
      key: 'outstanding',
      label: t('customers.detail.outstanding'),
      value: formatCurrency(loan.outstanding),
    },
  ].filter(Boolean);

  return (
    <View>
      <DetailRows rows={rows} className="mb-4" />

      <View className="flex-row gap-3">
        <StatCard
          label={t('customers.detail.accountsCount')}
          value={String(customer.accounts.length)}
          tone="bg-card border border-line"
        />
        <StatCard
          label={t('customers.detail.activeLoansCount')}
          value={String(customer.loans.filter((loan) => loan.status === 'active').length)}
          tone="bg-card border border-line"
        />
      </View>
    </View>
  );
}

function AccountsTab({ customer }) {
  const { t } = useTranslation();

  if (customer.accounts.length === 0) {
    return <EmptyState icon="wallet-outline" title={t('customers.detail.noAccounts')} />;
  }

  return customer.accounts.map((account) => (
    <ListCard
      key={account.id}
      title={account.name}
      subtitle={account.number}
      meta={
        <Text className="text-xs text-ink-muted">
          {t('customers.detail.currentBalance')}{' '}
          <Text className="font-semibold text-primary">{formatCurrency(account.balance)}</Text>
        </Text>
      }
      status={{
        label: t(`customers.status.${account.status}`),
        tone: ACCOUNT_STATUS_TONE[account.status] ?? 'neutral',
      }}
      onPress={() => {}}
    />
  ));
}

function LoansTab({ customer }) {
  const { t } = useTranslation();

  if (customer.loans.length === 0) {
    return <EmptyState icon="cash-outline" title={t('customers.detail.noLoans')} />;
  }

  return customer.loans.map((loan) => (
    <ListCard
      key={loan.id}
      title={loan.product}
      subtitle={loan.reference}
      meta={
        <Text className="text-xs text-ink-muted">
          <Text className="font-semibold text-primary">{formatCurrency(loan.outstanding)}</Text>{' '}
          {t('customers.detail.outstanding')}
        </Text>
      }
      status={{
        label: t(`loans.status.${loan.status}`),
        tone: LOAN_STATUS_TONE[loan.status] ?? 'neutral',
      }}
      onPress={() => navigateTo(`/loan/${loan.id}`)}
    />
  ));
}

function ActivityTab({ customer }) {
  const { t } = useTranslation();

  if (customer.activity.length === 0) {
    return <EmptyState icon="time-outline" title={t('customers.detail.noActivity')} />;
  }

  const entries = customer.activity.map((entry) => ({
    id: entry.id,
    title: entry.title,
    // Amount-bearing entries render as "₦41,850 on LN-09876".
    detail: entry.detail ?? `${formatCurrency(entry.amount)} on ${entry.reference}`,
    timestamp: entry.date,
  }));

  return <ActivityList entries={entries} />;
}
