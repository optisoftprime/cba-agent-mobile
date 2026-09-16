import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { COLLECTION_PERIODS, COLLECTION_TYPES, collectionsQuery } from '@/api/collections';
import { itemsOf } from '@/api/pagination';
import { AppHeader } from '@/components/layout/app-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterChips } from '@/components/ui/filter-chips';
import { ListCard } from '@/components/ui/list-card';
import { LoadingMore } from '@/components/ui/loading-more';
import { SectionHeading } from '@/components/ui/section-heading';
import { SelectPill } from '@/components/ui/select-field';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { StatusPill } from '@/components/ui/status-pill';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { navigateTo } from '@/lib/navigate';
import { COLLECTION_STATUS_TONE } from '@/lib/status';

const TILE = 'bg-card border border-line';

export default function CollectionsScreen() {
  const { t } = useTranslation();

  const [period, setPeriod] = useState('today');
  const [type, setType] = useState('all');

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
  } = useInfiniteQuery(
    collectionsQuery({ type: COLLECTION_TYPES[type], period: COLLECTION_PERIODS[period] }),
  );

  const collections = useMemo(() => itemsOf(data, 'collections'), [data]);
  // The tiles ride along on every page; page 0 is as good as any.
  const totals = data?.pages?.[0];

  const periodOptions = Object.keys(COLLECTION_PERIODS).map((value) => ({
    value,
    label: t(`collections.periods.${value}`),
  }));

  const typeOptions = Object.keys(COLLECTION_TYPES).map((value) => ({
    value,
    label: t(`collections.filters.${value}`),
  }));

  const header = (
    <View className="pt-4">
      {isPending ? (
        <View className="gap-3">
          {[0, 1].map((row) => (
            <View key={row} className="flex-row gap-3">
              {[0, 1].map((column) => (
                <View
                  key={column}
                  className="flex-1 rounded-2xl border border-line bg-card px-4 py-3.5">
                  <Skeleton width="60%" height={12} />
                  <Skeleton width="45%" height={22} style={{ marginTop: 10 }} />
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : (
        <View className="gap-3">
          <View className="flex-row gap-3">
            <StatCard
              label={t('collections.summary.today')}
              value={formatCurrency(totals?.today ?? 0)}
              tone={TILE}
            />
            <StatCard
              label={t('collections.summary.week')}
              value={formatCurrency(totals?.thisWeek ?? 0)}
              tone={TILE}
            />
          </View>
          <View className="flex-row gap-3">
            <StatCard
              label={t('collections.summary.month')}
              value={formatCurrency(totals?.thisMonth ?? 0)}
              tone={TILE}
            />
            <StatCard
              label={t('collections.summary.total')}
              value={formatCurrency(totals?.totalCollected ?? 0)}
              tone={TILE}
            />
          </View>
        </View>
      )}

      <SectionHeading
        className="mt-7"
        title={t('collections.history')}
        action={
          <SelectPill
            value={period}
            onChange={setPeriod}
            accessibilityLabel={t('collections.history')}
            options={periodOptions}
          />
        }
      />

      <FilterChips fill className="mb-4" value={type} onChange={setType} options={typeOptions} />
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <AppHeader showBack title={t('collections.title')} subtitle={t('collections.subtitle')} />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={isPending ? [] : collections}
          keyExtractor={(entry) => entry.reference}
          renderItem={({ item }) => (
            <ListCard
              overline={item.reference}
              title={formatCurrency(item.amount ?? 0)}
              titleTone="primary"
              subtitle={t(`collections.types.${String(item.type ?? '').toLowerCase()}`, {
                defaultValue: item.type,
              })}
              meta={[item.customerName, formatDateTime(item.capturedAt)].filter(Boolean).join(' · ')}
              footer={
                <StatusPill
                  label={item.status}
                  tone={COLLECTION_STATUS_TONE[String(item.status ?? '').toLowerCase()] ?? 'neutral'}
                />
              }
              onPress={() => navigateTo(`/collection/${encodeURIComponent(item.reference)}`)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching && !isFetchingNextPage}
          onRefresh={refetch}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListHeaderComponent={header}
          ListFooterComponent={<LoadingMore active={isFetchingNextPage} />}
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
                title={t('collections.empty.title')}
                message={t('collections.empty.message')}
              />
            )
          }
        />
      )}
    </View>
  );
}
