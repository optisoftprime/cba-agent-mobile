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
import { SkeletonCard } from '@/components/ui/skeleton';
import { navigateTo } from '@/lib/navigate';
import { useDebounced } from '@/lib/use-debounced';
import { usePermission } from '@/providers/permission-provider';

/**
 * Step 1 of 2 — who the Ajo plan is for.
 *
 * A picker rather than a dropdown on the form: an agent can have more
 * customers than a select can reasonably hold, and the search here is the
 * server's, so it reaches beyond the page that happens to be loaded.
 *
 * The choice is carried to the form in route params, the same way the deposit
 * flow carries its state.
 */
export default function AjoCustomerScreen() {
  const { t } = useTranslation();
  const access = usePermission(Permission.ajo);

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

  const customers = useMemo(() => itemsOf(data, 'customers'), [data]);

  if (!access.allowed) {
    return <LockedScreen showBack title={t('ajo.customer.title')} code={Permission.ajo} />;
  }

  return (
    <View className="flex-1 bg-background">
      <AppHeader showBack title={t('ajo.customer.title')} subtitle={t('ajo.customer.subtitle')} />

      <View className="px-4 pt-4">
        <SearchInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('customers.searchPlaceholder')}
        />
      </View>

      {isPending ? (
        <View className="px-4 pt-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} lines={2} />
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
              meta={item.phone}
              onPress={() =>
                navigateTo('/ajo/create', {
                  customerCode: item.customerCode,
                  customerName: item.name,
                })
              }
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
          // Without this the first tap on a customer while the keyboard is up
          // is swallowed dismissing it, and the agent has to tap twice.
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
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
              icon="people-outline"
              title={t('ajo.customer.empty.title')}
              message={t('ajo.customer.empty.message')}
            />
          }
        />
      )}
    </View>
  );
}
