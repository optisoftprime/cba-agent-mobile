import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getCollectionById } from '@/api/mock';
import { AppHeader, NotificationsAction } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { DetailRows } from '@/components/ui/detail-rows';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, maskAccount } from '@/lib/format';
import { navigateBack } from '@/lib/navigate';

export default function CollectionDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();

  const collection = getCollectionById(id);

  if (!collection) {
    return (
      <View className="flex-1 bg-background">
        <AppHeader showBack title={t('collections.detail.notFound')} />
        <EmptyState icon="wallet-outline" title={t('collections.detail.notFound')} />
      </View>
    );
  }

  const rows = [
    {
      key: 'amount',
      label: t('collections.detail.amount'),
      value: formatCurrency(collection.amount),
    },
    {
      key: 'type',
      label: t('collections.detail.type'),
      value: t(`collections.types.${collection.type}`),
    },
    { key: 'customer', label: t('collections.detail.customer'), value: collection.customerName },
    { key: 'account', label: t('collections.detail.account'), value: maskAccount(collection.account) },
    { key: 'when', label: t('collections.detail.dateTime'), value: collection.dateTime },
    {
      key: 'method',
      label: t('collections.detail.paymentMethod'),
      value: t(`collections.detail.methods.${collection.method}`),
    },
    {
      key: 'txn',
      label: t('collections.detail.transactionId'),
      value: collection.transactionId,
    },
    {
      key: 'status',
      label: t('collections.detail.statusLabel'),
      value: t(`collections.status.${collection.status}`),
    },
  ];

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        showBack
        title={t('collections.detail.title')}
        subtitle={t('collections.detail.subtitle')}
        right={<NotificationsAction />}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}>
        <DetailRows rows={rows} />

        {/* Pushes the action to the bottom when the list is short. */}
        <View className="min-h-8 flex-1" />

        <Button
          label={t('collections.detail.done')}
          size="lg"
          onPress={() => navigateBack('/collections')}
        />
      </ScrollView>
    </View>
  );
}
