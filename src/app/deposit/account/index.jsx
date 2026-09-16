import { useLocalSearchParams } from 'expo-router';
import { FlatList, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getCustomerById } from '@/api/mock';
import { AppHeader } from '@/components/layout/app-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ListCard } from '@/components/ui/list-card';
import { formatCurrency } from '@/lib/format';
import { navigateTo } from '@/lib/navigate';

/** Step 2 of 4 — which of the customer's accounts receives it. */
export default function DepositAccountScreen() {
  const { t } = useTranslation();
  const { customerId } = useLocalSearchParams();

  const customer = getCustomerById(customerId);
  const accounts = customer?.accounts ?? [];

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        showBack
        title={t('deposit.account.title')}
        subtitle={t('deposit.account.subtitle')}
      />

      <FlatList
        data={accounts}
        keyExtractor={(account) => account.id}
        renderItem={({ item }) => (
          <ListCard
            title={item.name}
            subtitle={item.number}
            meta={
              <Text className="text-xs text-ink-muted">
                {t('deposit.account.currentBalance')}{' '}
                <Text className="font-semibold text-primary">{formatCurrency(item.balance)}</Text>
              </Text>
            }
            onPress={() =>
              navigateTo('/deposit/amount', { customerId: customer.id, accountId: item.id })
            }
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="wallet-outline"
            title={t('deposit.account.empty.title')}
            message={t('deposit.account.empty.message')}
          />
        }
      />
    </View>
  );
}
