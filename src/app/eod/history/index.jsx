import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { eodHistoryQuery } from '@/api/eod';
import { itemsOf } from '@/api/pagination';
import { VarianceText } from '@/components/eod/variance-text';
import { AppHeader } from '@/components/layout/app-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { ListCard } from '@/components/ui/list-card';
import { LoadingMore } from '@/components/ui/loading-more';
import { SkeletonCard } from '@/components/ui/skeleton';
import { formatCurrencyPrecise, formatDate } from '@/lib/format';
import { EOD_STATUS_TONE } from '@/lib/status';

/**
 * Past end-of-day submissions, newest first.
 *
 * Each row reads: the day, what was counted against what was expected, and
 * the difference — the same wording and colours as the EOD screen, because
 * both go through `VarianceText`.
 */
export default function EodHistoryScreen() {
  const { t } = useTranslation();

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
  } = useInfiniteQuery(eodHistoryQuery);

  const days = useMemo(() => itemsOf(data, 'items'), [data]);

  return (
    <View className="flex-1 bg-background">
      <AppHeader showBack title={t('eod.history.title')} subtitle={t('eod.history.subtitle')} />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={isPending ? [] : days}
          keyExtractor={(day) => day.uuid ?? day.businessDate}
          renderItem={({ item }) => (
            <ListCard
              overline={formatDate(item.businessDate)}
              title={formatCurrencyPrecise(item.countedCash ?? 0)}
              titleTone="primary"
              subtitle={t('eod.history.expected', {
                amount: formatCurrencyPrecise(item.expectedCash ?? 0),
              })}
              meta={item.resolutionNote || null}
              footer={<VarianceText variance={item.variance} />}
              status={{
                label: item.status,
                tone: EOD_STATUS_TONE[String(item.status ?? '').toLowerCase()] ?? 'neutral',
              }}
              trailing={null}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching && !isFetchingNextPage}
          onRefresh={refetch}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListFooterComponent={<LoadingMore active={isFetchingNextPage} />}
          ListEmptyComponent={
            isPending ? (
              <View>
                {[0, 1, 2, 3].map((i) => (
                  <SkeletonCard key={i} lines={3} />
                ))}
              </View>
            ) : (
              <EmptyState
                icon="calendar-outline"
                title={t('eod.history.emptyTitle')}
                message={t('eod.history.emptyMessage')}
              />
            )
          }
        />
      )}
    </View>
  );
}
