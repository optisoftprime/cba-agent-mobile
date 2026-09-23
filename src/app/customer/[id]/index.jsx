import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  customerAccountsQuery,
  customerActivityQuery,
  customerLoansQuery,
  customerOverviewQuery,
  customerQuery,
} from '@/api/customers';
import { Permission } from '@/api/permissions';
import { AppHeader } from '@/components/layout/app-header';
import { LockedScreen } from '@/components/layout/locked-screen';
import { ActivityList } from '@/components/ui/activity-list';
import { Avatar } from '@/components/ui/avatar';
import { DetailRows } from '@/components/ui/detail-rows';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterChips } from '@/components/ui/filter-chips';
import { ListCard } from '@/components/ui/list-card';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { navigateTo } from '@/lib/navigate';
import { ACCOUNT_STATUS_TONE, CUSTOMER_STATUS_TONE, LOAN_STATUS_TONE } from '@/lib/status';
import { usePermission } from '@/providers/permission-provider';

const TABS = ['overview', 'account', 'loans', 'activity'];

/** Server statuses arrive in mixed case ("ACTIVE", "Active", "Completed"). */
const toneFor = (map, status) => map[String(status ?? '').toLowerCase()] ?? 'neutral';

export default function CustomerDetailScreen() {
  const { t } = useTranslation();
  const access = usePermission(Permission.customerManagement);
  const { id } = useLocalSearchParams();
  const [tab, setTab] = useState('overview');

  const customerCode = String(id ?? '');
  const header = useQuery(customerQuery(customerCode));

  const tabOptions = TABS.map((value) => ({
    value,
    label: t(`customers.detail.tabs.${value}`),
  }));

  if (!access.allowed) {
    return <LockedScreen showBack title={t('customers.title')} code={Permission.customerManagement} />;
  }

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        showBack
        title={header.data?.name ?? t('customers.detail.title')}
        subtitle={header.data?.customerCode ?? customerCode}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-4 pt-4">
          {header.isPending ? (
            <SkeletonCard>
              <View className="flex-row items-center gap-3">
                <Skeleton width={44} height={44} radius={22} />
                <View className="flex-1">
                  <Skeleton width="55%" height={16} />
                  <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
                </View>
              </View>
            </SkeletonCard>
          ) : header.isError ? (
            <ErrorState error={header.error} onRetry={header.refetch} compact />
          ) : (
            <ListCard
              leading={<Avatar name={header.data.name} />}
              title={header.data.name}
              subtitle={[header.data.segment, header.data.customerCode]
                .filter(Boolean)
                .join(' · ')}
              meta={header.data.phone}
              status={{
                label: header.data.status,
                tone: toneFor(CUSTOMER_STATUS_TONE, header.data.status),
              }}
              trailing={null}
            />
          )}
        </View>

        {header.data ? (
          <>
            <FilterChips options={tabOptions} value={tab} onChange={setTab} className="mb-4" />

            <View className="px-4">
              {tab === 'overview' ? <OverviewTab code={customerCode} /> : null}
              {tab === 'account' ? <AccountsTab code={customerCode} /> : null}
              {tab === 'loans' ? <LoansTab code={customerCode} /> : null}
              {tab === 'activity' ? <ActivityTab code={customerCode} /> : null}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

/** Shared shape for a tab that is loading, failed, or came back empty. */
function TabState({ query, emptyIcon, emptyTitle, emptyMessage, children, skeletonLines = 3 }) {
  if (query.isPending) {
    return (
      <View>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} lines={skeletonLines} />
        ))}
      </View>
    );
  }

  // A tab that fails gets the same treatment as a whole screen that fails:
  // why it failed, and a way to try again.
  if (query.isError) {
    return <ErrorState error={query.error} onRetry={query.refetch} compact />;
  }

  const isEmpty = Array.isArray(query.data) ? query.data.length === 0 : !query.data;
  if (isEmpty) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />;
  }

  return children;
}

function OverviewTab({ code }) {
  const { t } = useTranslation();
  const query = useQuery(customerOverviewQuery(code));
  const data = query.data;
  const loan = data?.primaryLoan;

  return (
    <TabState
      query={query}
      emptyIcon="person-outline"
      emptyTitle={t('customers.detail.noOverview')}>
      <View>
        <DetailRows
          className="mb-4"
          rows={[
            { key: 'customer', label: t('customers.detail.customer'), value: data?.name, tone: 'link' },
            { key: 'phone', label: t('customers.detail.phone'), value: data?.phone, copyable: true },
            { key: 'segment', label: t('customers.detail.segment'), value: data?.segment },
            {
              key: 'balance',
              label: t('customers.detail.managedBalance'),
              value: formatCurrency(data?.totalManagedBalance ?? 0),
            },
            ...(loan
              ? [
                  {
                    key: 'product',
                    label: t('customers.detail.loanProduct'),
                    value: `${loan.product} · ${loan.loanCode}`,
                  },
                  {
                    key: 'principal',
                    label: t('customers.detail.principal'),
                    value: formatCurrency(loan.principal ?? 0),
                  },
                  {
                    key: 'outstanding',
                    label: t('customers.detail.outstanding'),
                    value: formatCurrency(loan.outstanding ?? 0),
                  },
                ]
              : []),
          ]}
        />

        <View className="flex-row gap-3">
          <StatCard
            label={t('customers.detail.accountsCount')}
            value={String(data?.accountCount ?? 0)}
            tone="bg-card border border-line"
          />
          <StatCard
            label={t('customers.detail.activeLoansCount')}
            value={String(data?.activeLoanCount ?? 0)}
            tone="bg-card border border-line"
          />
        </View>
      </View>
    </TabState>
  );
}

function AccountsTab({ code }) {
  const { t } = useTranslation();
  const query = useQuery(customerAccountsQuery(code));

  return (
    <TabState
      query={query}
      emptyIcon="wallet-outline"
      emptyTitle={t('customers.detail.noAccounts')}
      emptyMessage={t('customers.detail.noAccountsMessage')}>
      <View>
        {query.data?.map((account) => (
          <ListCard
            key={account.accountNumber}
            title={account.accountName}
            subtitle={account.accountNumber}
            meta={
              <Text className="text-xs text-ink-muted">
                {t('customers.detail.currentBalance')}{' '}
                <Text className="font-semibold text-primary">
                  {formatCurrency(account.currentBalance ?? 0)}
                </Text>
              </Text>
            }
            status={{
              label: account.status,
              tone: toneFor(ACCOUNT_STATUS_TONE, account.status),
            }}
            trailing={null}
          />
        ))}
      </View>
    </TabState>
  );
}

function LoansTab({ code }) {
  const { t } = useTranslation();
  const query = useQuery(customerLoansQuery(code));

  return (
    <TabState
      query={query}
      emptyIcon="cash-outline"
      emptyTitle={t('customers.detail.noLoans')}
      emptyMessage={t('customers.detail.noLoansMessage')}>
      <View>
        {query.data?.map((loan) => (
          <ListCard
            key={loan.loanCode}
            title={loan.product}
            subtitle={loan.loanCode}
            meta={
              <Text className="text-xs text-ink-muted">
                <Text className="font-semibold text-primary">
                  {formatCurrency(loan.outstanding ?? 0)}
                </Text>{' '}
                {t('customers.detail.outstanding')}
              </Text>
            }
            status={{ label: loan.status, tone: toneFor(LOAN_STATUS_TONE, loan.status) }}
            onPress={() => navigateTo(`/loan/${encodeURIComponent(loan.loanCode)}`)}
          />
        ))}
      </View>
    </TabState>
  );
}

function ActivityTab({ code }) {
  const { t } = useTranslation();
  const query = useQuery(customerActivityQuery(code));

  return (
    <TabState
      query={query}
      emptyIcon="time-outline"
      emptyTitle={t('customers.detail.noActivity')}
      emptyMessage={t('customers.detail.noActivityMessage')}>
      <ActivityList
        entries={(query.data ?? []).map((entry, index) => ({
          // No id on these records, and the same event can repeat.
          id: `${entry.occurredAt}-${index}`,
          title: entry.title,
          // Already formatted by the server ("₦5500 on LID72037439").
          detail: entry.detail,
          timestamp: formatDateTime(entry.occurredAt),
        }))}
      />
    </TabState>
  );
}
