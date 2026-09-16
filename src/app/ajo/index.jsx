import { useQuery } from '@tanstack/react-query';
import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ajoHomeQuery } from '@/api/ajo';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { ListCard } from '@/components/ui/list-card';
import { SectionHeading } from '@/components/ui/section-heading';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { formatCurrency } from '@/lib/format';
import { navigateTo } from '@/lib/navigate';
import { AJO_STATUS_TONE } from '@/lib/status';

const TILE = 'bg-card border border-line';

/**
 * Ajo home — the four tiles and the agent's active plans.
 *
 * A plain FlatList, not an infinite one: this endpoint takes no page/size and
 * returns every plan at once (see src/api/ajo.js).
 */
export default function AjoScreen() {
  const { t } = useTranslation();

  const { data, isPending, isError, error, refetch, isRefetching } = useQuery(ajoHomeQuery);

  const plans = data?.plans ?? [];

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
              label={t('ajo.summary.todaysExpected')}
              value={formatCurrency(data?.todaysExpected ?? 0)}
              tone={TILE}
            />
            <StatCard
              label={t('ajo.summary.collectedToday')}
              value={formatCurrency(data?.collectedToday ?? 0)}
              tone={TILE}
            />
          </View>
          <View className="flex-row gap-3">
            {/* activeAjo is a COUNT of plans; the other three are amounts. */}
            <StatCard
              label={t('ajo.summary.activeAjo')}
              value={String(data?.activeAjo ?? 0)}
              tone={TILE}
            />
            <StatCard
              label={t('ajo.summary.pending')}
              value={formatCurrency(data?.pending ?? 0)}
              tone={TILE}
            />
          </View>
        </View>
      )}

      <Button
        className="mb-7 mt-5"
        label={t('ajo.create.action')}
        icon="add"
        size="lg"
        onPress={() => navigateTo('/ajo/customer')}
      />

      <SectionHeading title={t('ajo.myPlans')} />
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <AppHeader showBack title={t('ajo.title')} subtitle={t('ajo.subtitle')} />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={isPending ? [] : plans}
          keyExtractor={(plan) => plan.reference}
          renderItem={({ item }) => (
            <ListCard
              overline={item.reference}
              title={item.planName}
              subtitle={item.customerName}
              meta={[
                item.frequency && t(`ajo.frequencies.${String(item.frequency).toLowerCase()}`, {
                  defaultValue: item.frequency,
                }),
                item.contributionAmount != null && formatCurrency(item.contributionAmount),
                item.duration ? t('ajo.durationDays', { days: item.duration }) : null,
              ]
                .filter(Boolean)
                .join(' · ')}
              footer={
                // What has actually been paid in, against what is expected.
                item.expectedTotal
                  ? t('ajo.progress', {
                      paid: formatCurrency(item.contributedTotal ?? 0),
                      expected: formatCurrency(item.expectedTotal),
                    })
                  : null
              }
              status={
                item.status
                  ? {
                      label: item.status,
                      tone: AJO_STATUS_TONE[String(item.status).toLowerCase()] ?? 'neutral',
                    }
                  : null
              }
              onPress={() => navigateTo(`/ajo/${encodeURIComponent(item.reference)}`)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListHeaderComponent={header}
          ListEmptyComponent={
            isPending ? (
              <View>
                {[0, 1, 2].map((i) => (
                  <SkeletonCard key={i} lines={3} />
                ))}
              </View>
            ) : (
              <EmptyState
                icon="albums-outline"
                title={t('ajo.empty.title')}
                message={t('ajo.empty.message')}
              />
            )
          }
        />
      )}
    </View>
  );
}
