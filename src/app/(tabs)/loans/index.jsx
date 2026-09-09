import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getLoans } from '@/api/mock';
import { AppHeader, NotificationsAction } from '@/components/layout/app-header';
import { LoanCard } from '@/components/loans/loan-card';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterChips } from '@/components/ui/filter-chips';
import { SearchInput } from '@/components/ui/search-input';
import { navigateTo } from '@/lib/navigate';

/** Each filter is just a predicate, so adding one is a single line. */
const FILTERS = {
  all: () => true,
  active: (loan) => loan.status === 'active',
  due: (loan) => loan.status === 'due',
  overdue: (loan) => loan.status === 'overdue',
};

export default function LoansScreen() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const loans = getLoans();

  const options = Object.keys(FILTERS).map((value) => ({
    value,
    label: t(`loans.filters.${value}`),
  }));

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matchesFilter = FILTERS[filter] ?? FILTERS.all;

    return loans.filter(matchesFilter).filter((loan) => {
      if (!needle) return true;
      // Matches what the placeholder promises: customer, loan ID or product.
      return (
        loan.customerName.toLowerCase().includes(needle) ||
        loan.reference.toLowerCase().includes(needle) ||
        loan.product.toLowerCase().includes(needle)
      );
    });
  }, [loans, query, filter]);

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        title={t('loans.title')}
        subtitle={t('loans.assigned', { count: loans.length })}
        right={<NotificationsAction />}
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

      <FlatList
        data={visible}
        keyExtractor={(loan) => loan.id}
        renderItem={({ item }) => (
          <LoanCard loan={item} onPress={() => navigateTo(`/loan/${item.id}`)} />
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="cash-outline"
            title={t('loans.empty.title')}
            message={t('loans.empty.message')}
          />
        }
      />
    </View>
  );
}
