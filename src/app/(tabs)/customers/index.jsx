import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CUSTOMER_FILTERS, customersQuery } from '@/api/customers';
import { itemsOf, totalOf } from '@/api/pagination';
import { Permission } from '@/api/permissions';
import { AppHeader } from '@/components/layout/app-header';
import { LockedScreen } from '@/components/layout/locked-screen';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterChips } from '@/components/ui/filter-chips';
import { ListCard } from '@/components/ui/list-card';
import { LoadingMore } from '@/components/ui/loading-more';
import { SearchInput } from '@/components/ui/search-input';
import { SkeletonCard } from '@/components/ui/skeleton';
import { navigateTo } from '@/lib/navigate';
import { CUSTOMER_STATUS_TONE } from '@/lib/status';
import { useDebounced } from '@/lib/use-debounced';
import { usePermission } from '@/providers/permission-provider';

export default function CustomersScreen() {
  const { t } = useTranslation();
  const access = usePermission(Permission.customerManagement);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  // Server-side search, so the request waits for typing to settle.
  const search = useDebounced(query.trim());

  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(customersQuery({ search, filter: CUSTOMER_FILTERS[filter] }));

  const customers = useMemo(() => itemsOf(data, 'customers'), [data]);
  const total = totalOf(data);

  const options = Object.keys(CUSTOMER_FILTERS).map((value) => ({
    value,
    label: t(`customers.filters.${value}`),
  }));

  // SME customers are LISTED but not OPENABLE: the customer screen is built
  // around an individual's accounts and loans, and an SME record does not fit
  // it. A row with no `onPress` is not pressable and drops its chevron, so it
  // reads as a plain entry rather than a tap that does nothing.
  const canOpen = filter !== 'sme';

  /** "3 Accounts 1 loan" — the counts are data, the words are UI labels. */
  const summaryFor = (customer) => {
    const accounts = customer.accounts ?? 0;
    const loans = customer.loans ?? 0;
    return [
      `${accounts} ${t(accounts === 1 ? 'customers.account' : 'customers.accounts')}`,
      `${loans} ${t(loans === 1 ? 'customers.loan' : 'customers.loans')}`,
    ].join(' ');
  };

  if (!access.allowed) {
    return <LockedScreen title={t('customers.title')} code={Permission.customerManagement} />;
  }

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        title={t('customers.title')}
        subtitle={isPending ? undefined : t('customers.assigned', { count: total })}
      />

      {/* Search and filters stay pinned; only the list scrolls. */}
      <View className="gap-3 pt-4">
        <View className="px-4">
          <SearchInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('customers.searchPlaceholder')}
          />
        </View>
        <FilterChips options={options} value={filter} onChange={setFilter} />
      </View>

      {isPending ? (
        <View className="px-4 pt-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} lines={3} />
          ))}
        </View>
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(customer) => customer.customerCode}
          renderItem={({ item }) => (
            <ListCard
              leading={<Avatar name={item.name} />}
              title={item.name}
              subtitle={item.customerCode}
              meta={summaryFor(item)}
              status={{
                label: item.status,
                tone: CUSTOMER_STATUS_TONE[String(item.status).toLowerCase()] ?? 'neutral',
              }}
              trailing={canOpen ? 'chevron' : null}
              onPress={
                canOpen
                  ? () => navigateTo(`/customer/${encodeURIComponent(item.customerCode)}`)
                  : undefined
              }
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching && !isFetchingNextPage}
          onRefresh={refetch}
          // Infinite scroll: the next page is fetched before the agent reaches
          // the bottom, so the list doesn't visibly stall.
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListFooterComponent={<LoadingMore active={isFetchingNextPage} />}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              // BUG-089: same reasoning as the loans tabs — the empty state has
              // to answer the question the selected tab asked.
              title={
                search ? t('customers.empty.title') : t(`customers.empty.filters.${filter}.title`)
              }
              message={
                search
                  ? t('customers.empty.searchMessage')
                  : t(`customers.empty.filters.${filter}.message`)
              }
            />
          }
        />
      )}
    </View>
  );
}
