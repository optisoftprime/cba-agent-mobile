import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getCustomers } from '@/api/mock';
import { AppHeader, NotificationsAction } from '@/components/layout/app-header';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { ListCard } from '@/components/ui/list-card';
import { SearchInput } from '@/components/ui/search-input';
import { navigateTo } from '@/lib/navigate';

/** Step 1 of 4 — who the deposit is for. */
export default function DepositCustomerScreen() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const customers = getCustomers();

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return customers;

    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(needle) ||
        customer.code.toLowerCase().includes(needle) ||
        customer.accounts.some((account) => account.number.includes(needle)),
    );
  }, [customers, query]);

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
        showBack
        title={t('deposit.customer.title')}
        subtitle={t('deposit.customer.subtitle')}
        right={<NotificationsAction />}
      />

      <View className="px-4 pt-4">
        <SearchInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('deposit.customer.searchPlaceholder')}
        />
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
            onPress={() => navigateTo('/deposit/account', { customerId: item.id })}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text className="py-4 text-[13px] font-medium text-primary">
            {t('deposit.customer.results')}
          </Text>
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={t('deposit.customer.empty.title')}
            message={t('deposit.customer.empty.message')}
          />
        }
      />
    </View>
  );
}
