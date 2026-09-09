import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getCustomers } from '@/api/mock';
import { AppHeader, NotificationsAction } from '@/components/layout/app-header';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterChips } from '@/components/ui/filter-chips';
import { ListCard } from '@/components/ui/list-card';
import { SearchInput } from '@/components/ui/search-input';
import { navigateTo } from '@/lib/navigate';
import { CUSTOMER_STATUS_TONE } from '@/lib/status';

/** Each filter is just a predicate, so adding one is a single line. */
const FILTERS = {
  all: () => true,
  active: (customer) => customer.status === 'active',
  inactive: (customer) => customer.status === 'inactive',
  sme: (customer) => customer.segment === 'sme',
};

export default function CustomersScreen() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const customers = getCustomers();

  const options = Object.keys(FILTERS).map((value) => ({
    value,
    label: t(`customers.filters.${value}`),
  }));

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matchesFilter = FILTERS[filter] ?? FILTERS.all;

    return customers.filter(matchesFilter).filter((customer) => {
      if (!needle) return true;
      // Matches what the placeholder promises: name or customer ID.
      return (
        customer.name.toLowerCase().includes(needle) || customer.code.toLowerCase().includes(needle)
      );
    });
  }, [customers, query, filter]);

  /** "3 Accounts 1 loan" — counts are data, the words are UI labels. */
  const summaryFor = (customer) => {
    const accounts = customer.accounts.length;
    const loans = customer.loans.length;
    const accountsLabel = t(accounts === 1 ? 'customers.account' : 'customers.accounts');
    const loansLabel = t(loans === 1 ? 'customers.loan' : 'customers.loans');
    return `${accounts} ${accountsLabel} ${loans} ${loansLabel}`;
  };

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        title={t('customers.title')}
        subtitle={t('customers.assigned', { count: customers.length })}
        right={<NotificationsAction />}
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

      <FlatList
        data={visible}
        keyExtractor={(customer) => customer.id}
        renderItem={({ item }) => (
          <ListCard
            leading={<Avatar name={item.name} />}
            title={item.name}
            subtitle={item.code}
            meta={summaryFor(item)}
            status={{
              label: t(`customers.status.${item.status}`),
              tone: CUSTOMER_STATUS_TONE[item.status] ?? 'neutral',
            }}
            onPress={() => navigateTo(`/customer/${item.id}`)}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={t('customers.empty.title')}
            message={t('customers.empty.message')}
          />
        }
      />
    </View>
  );
}
