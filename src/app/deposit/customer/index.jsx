import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CUSTOMER_FILTERS, customersQuery } from '@/api/customers';
import { itemsOf } from '@/api/pagination';
import { Permission } from '@/api/permissions';
import { AppHeader } from '@/components/layout/app-header';
import { LockedScreen } from '@/components/layout/locked-screen';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { ListCard } from '@/components/ui/list-card';
import { LoadingMore } from '@/components/ui/loading-more';
import { SearchInput } from '@/components/ui/search-input';
import { SectionHeading } from '@/components/ui/section-heading';
import { SkeletonCard } from '@/components/ui/skeleton';
import { navigateTo } from '@/lib/navigate';
import { useDebounced } from '@/lib/use-debounced';
import { usePermission, useRefreshWithPermissions } from '@/providers/permission-provider';

/** Step 1 of 4 — who the deposit is for. */
export default function DepositCustomerScreen() {
  const { t } = useTranslation();
  const access = usePermission(Permission.deposit);

  const [query, setQuery] = useState('');
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
  } = useInfiniteQuery(customersQuery({ search, filter: CUSTOMER_FILTERS.all }));

  const onRefresh = useRefreshWithPermissions(refetch);

  const customers = useMemo(() => itemsOf(data, 'customers'), [data]);

  /** "1 Account 20 loans" — the counts are data, the words are UI labels. */
  const summaryFor = (customer) => {
    const accounts = customer.accounts ?? 0;
    const loans = customer.loans ?? 0;
    return [
      `${accounts} ${t(accounts === 1 ? 'customers.account' : 'customers.accounts')}`,
      `${loans} ${t(loans === 1 ? 'customers.loan' : 'customers.loans')}`,
    ].join(' ');
  };

  if (!access.allowed) {
    return <LockedScreen showBack title={t('deposit.customer.title')} code={Permission.deposit} />;
  }

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        showBack
        title={t('deposit.customer.title')}
        subtitle={t('deposit.customer.subtitle')}
      />

      <View className="px-4 pt-4">
        <SearchInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('deposit.customer.searchPlaceholder')}
        />
      </View>

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={isPending ? [] : customers}
          keyExtractor={(customer) => customer.customerCode}
          renderItem={({ item }) => (
            <ListCard
              leading={<Avatar name={item.name} />}
              title={item.name}
              subtitle={item.customerCode}
              meta={summaryFor(item)}
              onPress={() =>
                navigateTo('/deposit/account', {
                  customerCode: item.customerCode,
                  customerName: item.name,
                })
              }
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching && !isFetchingNextPage}
          onRefresh={onRefresh}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListHeaderComponent={<SectionHeading className="py-4" title={t('deposit.customer.results')} />}
          ListFooterComponent={<LoadingMore active={isFetchingNextPage} />}
          ListEmptyComponent={
            isPending ? (
              <View>
                {[0, 1, 2, 3, 4].map((i) => (
                  <SkeletonCard key={i} lines={3} />
                ))}
              </View>
            ) : (
              <EmptyState
                icon="people-outline"
                title={t('deposit.customer.empty.title')}
                message={t('deposit.customer.empty.message')}
              />
            )
          }
        />
      )}
    </View>
  );
}
