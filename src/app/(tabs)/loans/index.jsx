import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LOAN_FILTERS, loansQuery } from '@/api/loans';
import { itemsOf, totalOf } from '@/api/pagination';
import { Permission } from '@/api/permissions';
import { AppHeader } from '@/components/layout/app-header';
import { LockedScreen } from '@/components/layout/locked-screen';
import { LoanCard } from '@/components/loans/loan-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterChips } from '@/components/ui/filter-chips';
import { LoadingMore } from '@/components/ui/loading-more';
import { SearchInput } from '@/components/ui/search-input';
import { SkeletonCard } from '@/components/ui/skeleton';
import { navigateTo } from '@/lib/navigate';
import { useDebounced } from '@/lib/use-debounced';
import { usePermission } from '@/providers/permission-provider';

export default function LoansScreen() {
  const { t } = useTranslation();
  const access = usePermission(Permission.loanCollection);

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
  } = useInfiniteQuery(loansQuery({ search, filter: LOAN_FILTERS[filter] }));

  const loans = useMemo(() => itemsOf(data, 'loans'), [data]);
  const total = totalOf(data);

  const options = Object.keys(LOAN_FILTERS).map((value) => ({
    value,
    label: t(`loans.filters.${value}`),
  }));

  if (!access.allowed) {
    return <LockedScreen title={t('loans.title')} code={Permission.loanCollection} />;
  }

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        title={t('loans.title')}
        subtitle={isPending ? undefined : t('loans.assigned', { count: total })}
      />

      {/* Search and filters stay pinned; only the list scrolls. */}
      <View className="gap-3 pt-4">
        <View className="px-4">
          <SearchInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('loans.searchPlaceholder')}
          />
        </View>
        <FilterChips options={options} value={filter} onChange={setFilter} />
      </View>

      {isPending ? (
        <View className="px-4 pt-4">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} lines={4} />
          ))}
        </View>
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(loan) => loan.loanCode}
          renderItem={({ item }) => (
            <LoanCard
              loan={{
                customerName: item.customerName,
                product: item.product,
                reference: item.loanCode,
                status: item.status,
                outstanding: item.outstanding,
                nextPayment: item.nextPayment,
                dueDate: item.nextDueDate,
              }}
              onPress={() => navigateTo(`/loan/${encodeURIComponent(item.loanCode)}`)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching && !isFetchingNextPage}
          onRefresh={refetch}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListFooterComponent={<LoadingMore active={isFetchingNextPage} />}
          ListEmptyComponent={
            <EmptyState
              icon="cash-outline"
              // BUG-088: each tab is a different question, so "no loans found"
              // under Overdue told the agent nothing. A search that matched
              // nothing is a third case again.
              title={
                search ? t('loans.empty.title') : t(`loans.empty.filters.${filter}.title`)
              }
              message={
                search
                  ? t('loans.empty.searchMessage')
                  : t(`loans.empty.filters.${filter}.message`)
              }
            />
          }
        />
      )}
    </View>
  );
}
