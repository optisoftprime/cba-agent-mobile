import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { FlatList, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { customerAccountsQuery } from '@/api/customers';
import { AppHeader } from '@/components/layout/app-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { ListCard } from '@/components/ui/list-card';
import { SkeletonCard } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/format';
import { navigateTo } from '@/lib/navigate';
import { ACCOUNT_STATUS_TONE } from '@/lib/status';

/** Step 2 of 4 — which of the customer's accounts receives it. */
export default function DepositAccountScreen() {
  const { t } = useTranslation();
  const { customerCode, customerName } = useLocalSearchParams();

  const code = String(customerCode ?? '');
  const { data, isPending, isError, error, refetch, isRefetching } = useQuery(
    customerAccountsQuery(code),
  );

  const accounts = data ?? [];

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        showBack
        title={t('deposit.account.title')}
        subtitle={customerName ? String(customerName) : t('deposit.account.subtitle')}
      />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={isPending ? [] : accounts}
          keyExtractor={(account) => account.accountNumber}
          renderItem={({ item }) => (
            <ListCard
              title={item.accountName}
              subtitle={item.accountNumber}
              meta={
                <Text className="text-xs text-ink-muted">
                  {t('deposit.account.currentBalance')}{' '}
                  <Text className="font-semibold text-primary">
                    {formatCurrency(item.currentBalance ?? 0)}
                  </Text>
                </Text>
              }
              status={
                item.status
                  ? {
                      label: item.status,
                      tone: ACCOUNT_STATUS_TONE[String(item.status).toLowerCase()] ?? 'neutral',
                    }
                  : null
              }
              onPress={() =>
                navigateTo('/deposit/amount', {
                  customerCode: code,
                  customerName: customerName ?? '',
                  accountNumber: item.accountNumber,
                  accountName: item.accountName,
                })
              }
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            isPending ? (
              <View>
                {[0, 1, 2].map((i) => (
                  <SkeletonCard key={i} lines={3} />
                ))}
              </View>
            ) : (
              <EmptyState
                icon="wallet-outline"
                title={t('deposit.account.empty.title')}
                message={t('deposit.account.empty.message')}
              />
            )
          }
        />
      )}
    </View>
  );
}
