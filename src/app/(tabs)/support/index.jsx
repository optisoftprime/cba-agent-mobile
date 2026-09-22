import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { itemsOf } from '@/api/pagination';
import { ticketsQuery } from '@/api/support';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { ListCard } from '@/components/ui/list-card';
import { LoadingMore } from '@/components/ui/loading-more';
import { SectionHeading } from '@/components/ui/section-heading';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { formatDate } from '@/lib/format';
import { navigateTo } from '@/lib/navigate';
import { useRefreshWithPermissions } from '@/providers/permission-provider';
import { TICKET_STATUS_TONE } from '@/lib/status';

const TILE = 'bg-card border border-line';

export default function SupportScreen() {
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
  } = useInfiniteQuery(ticketsQuery());

  const onRefresh = useRefreshWithPermissions(refetch);

  const tickets = useMemo(() => itemsOf(data, 'tickets'), [data]);
  // The three counts ride along on every page; page 0 is as good as any.
  const counts = data?.pages?.[0];

  const header = (
    <View className="pt-4">
      {isPending ? (
        <View className="flex-row gap-3">
          {[0, 1, 2].map((i) => (
            <View key={i} className="flex-1 items-center rounded-2xl border border-line bg-card px-3 py-4">
              <Skeleton width={28} height={22} />
              <Skeleton width="70%" height={11} style={{ marginTop: 8 }} />
            </View>
          ))}
        </View>
      ) : (
        <View className="flex-row gap-3">
          <StatCard
            layout="count"
            label={t('support.counts.open')}
            value={String(counts?.open ?? 0)}
            tone={TILE}
          />
          <StatCard
            layout="count"
            label={t('support.counts.inProgress')}
            value={String(counts?.inProgress ?? 0)}
            tone={TILE}
          />
          <StatCard
            layout="count"
            label={t('support.counts.resolved')}
            value={String(counts?.resolved ?? 0)}
            tone={TILE}
          />
        </View>
      )}

      <Button
        label={t('support.createTicket')}
        icon="add"
        size="lg"
        className="mb-7 mt-5"
        onPress={() => navigateTo('/ticket/create')}
      />

      <SectionHeading title={t('support.myTickets')} />
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <AppHeader title={t('support.title')} subtitle={t('support.subtitle')} />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={isPending ? [] : tickets}
          keyExtractor={(ticket) => ticket.ticketNumber}
          renderItem={({ item }) => (
            <ListCard
              overline={item.ticketNumber}
              title={item.subject}
              meta={[item.category, item.createdAt && formatDate(item.createdAt)]
                .filter(Boolean)
                .join(' · ')}
              status={{
                label: item.status,
                tone:
                  TICKET_STATUS_TONE[String(item.status ?? '').toLowerCase().replace(/\s+/g, '_')] ??
                  'neutral',
              }}
              onPress={() => navigateTo(`/ticket/${encodeURIComponent(item.ticketNumber)}`)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching && !isFetchingNextPage}
          onRefresh={onRefresh}
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
                icon="chatbubble-ellipses-outline"
                title={t('support.empty.title')}
                message={t('support.empty.message')}
              />
            )
          }
        />
      )}
    </View>
  );
}
