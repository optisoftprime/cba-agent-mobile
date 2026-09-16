import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { collectionQuery } from '@/api/collections';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { DetailRows } from '@/components/ui/detail-rows';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { formatCurrency, formatDateTime, maskAccount } from '@/lib/format';
import { navigateBack } from '@/lib/navigate';
import { COLLECTION_STATUS_TONE } from '@/lib/status';

export default function CollectionDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();

  const reference = String(id ?? '');
  const { data, isPending, isError, error, refetch } = useQuery(collectionQuery(reference));

  const rows = data
    ? [
        {
          key: 'reference',
          label: t('collections.detail.reference'),
          // Quoted when querying a movement, so it needs to be copyable.
          value: data.reference,
          copyable: true,
        },
        { key: 'amount', label: t('collections.detail.amount'), value: formatCurrency(data.amount ?? 0) },
        {
          key: 'type',
          label: t('collections.detail.type'),
          value: t(`collections.types.${String(data.type ?? '').toLowerCase()}`, {
            defaultValue: data.type,
          }),
        },
        { key: 'customer', label: t('collections.detail.customer'), value: data.customerName },
        { key: 'account', label: t('collections.detail.account'), value: maskAccount(data.account) },
        {
          key: 'when',
          label: t('collections.detail.dateTime'),
          value: formatDateTime(data.capturedAt),
        },
        {
          key: 'method',
          label: t('collections.detail.paymentMethod'),
          value: data.paymentMethod,
        },
        {
          key: 'txn',
          label: t('collections.detail.transactionId'),
          // The value an agent quotes when querying a movement with support.
          value: data.transactionId,
          copyable: true,
        },
        {
          key: 'status',
          label: t('collections.detail.statusLabel'),
          value: (
            <StatusPill
              label={data.status}
              tone={COLLECTION_STATUS_TONE[String(data.status ?? '').toLowerCase()] ?? 'neutral'}
            />
          ),
        },
      ]
    : [];

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        showBack
        title={t('collections.detail.title')}
        // The reference identifies THIS movement; the static subtitle said the
        // same thing on every one of them.
        subtitle={data?.reference ?? reference}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}>
        {isPending ? (
          <View className="overflow-hidden rounded-2xl border border-line bg-card">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View
                key={i}
                className={`flex-row items-center justify-between px-4 py-4 ${
                  i < 5 ? 'border-b border-line' : ''
                }`}>
                <Skeleton width="30%" height={12} />
                <Skeleton width="35%" height={12} />
              </View>
            ))}
          </View>
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <>
            <DetailRows rows={rows} />

            {/* Pushes the action to the bottom when the list is short. */}
            <View className="min-h-8 flex-1" />

            <Button
              label={t('collections.detail.done')}
              size="lg"
              onPress={() => navigateBack('/collections')}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}
