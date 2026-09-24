import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { eodHistoryQuery } from '@/api/eod';
import { itemsOf } from '@/api/pagination';
import { VARIANCE_TONE, VarianceText, varianceLabel } from '@/components/eod/variance-text';
import { AppHeader } from '@/components/layout/app-header';
import { DetailsModal } from '@/components/ui/details-modal';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { ListCard } from '@/components/ui/list-card';
import { LoadingMore } from '@/components/ui/loading-more';
import { SkeletonCard } from '@/components/ui/skeleton';
import { formatCurrencyPrecise, formatDate, formatDateTime, NO_FIGURE } from '@/lib/format';
import { EOD_STATUS_TONE } from '@/lib/status';
import { describeVariance } from '@/lib/variance';
import { useRefreshWithPermissions } from '@/providers/permission-provider';

/** A status pill's tone, as `ui/details-modal` names its colours. */
const MODAL_TONE = {
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'muted',
  neutral: 'muted',
};

/**
 * Every end-of-day report this agent has submitted, newest first.
 *
 * A card carries the four figures worth scanning — date, counted, expected,
 * difference — and tapping it opens the full report, because the server sends
 * ten fields and a card that quietly drops six invites the agent to wonder
 * what it is hiding. The wording is the same as the End of day screen, so a
 * figure means the same thing in both places.
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

  const onRefresh = useRefreshWithPermissions(refetch);

  const days = useMemo(() => itemsOf(data, 'items'), [data]);
  const [openReport, setOpenReport] = useState(null);

  const statusTone = (status) => EOD_STATUS_TONE[String(status ?? '').toLowerCase()] ?? 'neutral';

  /**
   * EVERY field the server sends for a day, in the order it is read: what was
   * expected, then what was found, then who touched it. Nothing is dropped for
   * being empty — on a screen whose whole job is "show me the full report", a
   * missing field is itself the answer to a question ("has anyone resolved
   * this?"), so it reads as a dash rather than vanishing.
   */
  const reportRows = (day) =>
    [
      { key: 'date', label: t('eod.report.businessDate'), value: formatDate(day.businessDate) },
      // Inside a Modal the value is TEXT plus a tone, never a class-styled
      // pill — the theme's classes do not reach into a Modal's host tree.
      {
        key: 'status',
        label: t('eod.position.status'),
        value: day.status ?? t('eod.state.open'),
        tone: MODAL_TONE[statusTone(day.status)],
      },
      { key: 'settled', label: t('eod.position.settled'), value: money(day.settledCash) },
      { key: 'in', label: t('eod.position.pendingIn'), value: money(day.pendingIn) },
      { key: 'out', label: t('eod.position.pendingOut'), value: money(day.pendingOut) },
      { key: 'expected', label: t('eod.position.expected'), value: money(day.expectedCash) },
      { key: 'counted', label: t('eod.position.counted'), value: money(day.countedCash) },
      {
        key: 'variance',
        label: t('eod.position.variance'),
        value: varianceLabel(t, day.variance),
        tone: VARIANCE_TONE[describeVariance(day.variance).kind],
      },
      {
        key: 'submittedAt',
        label: t('eod.position.submittedAt'),
        value: day.submittedAt ? formatDateTime(day.submittedAt) : NO_FIGURE,
      },
      { key: 'submittedBy', label: t('eod.report.submittedBy'), value: day.submittedBy || NO_FIGURE },
      { key: 'resolvedBy', label: t('eod.report.resolvedBy'), value: day.resolvedBy || NO_FIGURE },
      {
        key: 'note',
        label: t('eod.position.resolution'),
        value: day.resolutionNote || NO_FIGURE,
      },
      { key: 'agent', label: t('eod.report.agentCode'), value: day.agentCode || NO_FIGURE },
      // The record's own id, last: an agent quoting a day to support needs
      // something the back office can look up.
      { key: 'uuid', label: t('eod.report.reference'), value: day.uuid || NO_FIGURE },
    ];

  return (
    <View className="flex-1 bg-background">
      <AppHeader showBack title={t('eod.history.title')} subtitle={t('eod.history.subtitle')} />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={isPending ? [] : days}
          keyExtractor={(day, index) => day.uuid ?? day.businessDate ?? String(index)}
          renderItem={({ item }) => (
            <ListCard
              overline={formatDate(item.businessDate)}
              title={t('eod.history.countedLine', { amount: money(item.countedCash) })}
              titleTone="primary"
              subtitle={t('eod.history.expectedLine', { amount: money(item.expectedCash) })}
              footer={<VarianceText variance={item.variance} />}
              status={{ label: item.status, tone: statusTone(item.status) }}
              onPress={() => setOpenReport(item)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching && !isFetchingNextPage}
          onRefresh={onRefresh}
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

      <DetailsModal
        visible={openReport !== null}
        title={t('eod.report.title')}
        subtitle={openReport ? formatDate(openReport.businessDate) : undefined}
        rows={openReport ? reportRows(openReport) : []}
        onClose={() => setOpenReport(null)}
      />
    </View>
  );
}

/**
 * A missing figure is not zero naira. `formatCurrencyPrecise` reads a null as
 * 0 (JavaScript does), so the check has to happen here.
 */
function money(amount) {
  return amount == null ? NO_FIGURE : formatCurrencyPrecise(amount);
}
