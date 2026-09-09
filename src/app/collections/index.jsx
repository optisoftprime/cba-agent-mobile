import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getCollections, getCollectionSummary } from '@/api/mock';
import { AppHeader, NotificationsAction } from '@/components/layout/app-header';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterChips } from '@/components/ui/filter-chips';
import { ListCard } from '@/components/ui/list-card';
import { SectionHeading } from '@/components/ui/section-heading';
import { SelectPill } from '@/components/ui/select-field';
import { StatCard } from '@/components/ui/stat-card';
import { StatusPill } from '@/components/ui/status-pill';
import { formatCurrency } from '@/lib/format';
import { navigateTo } from '@/lib/navigate';

const PERIODS = ['today', 'week', 'month', 'all'];

/** Each filter is just a predicate, so adding one is a single line. */
const FILTERS = {
  all: () => true,
  deposit: (entry) => entry.type === 'deposit',
  ajo: (entry) => entry.type === 'ajo',
};

const TILE = 'bg-card border border-line';

export default function CollectionsScreen() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('today');
  const [filter, setFilter] = useState('all');

  const collections = getCollections();
  const summary = getCollectionSummary();

  const visible = useMemo(
    () => collections.filter(FILTERS[filter] ?? FILTERS.all),
    [collections, filter],
  );

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        showBack
        title={t('collections.title')}
        subtitle={t('collections.subtitle')}
        right={<NotificationsAction />}
      />

      <FlatList
        data={visible}
        keyExtractor={(entry) => entry.id}
        renderItem={({ item }) => (
          <ListCard
            title={formatCurrency(item.amount)}
            titleTone="primary"
            subtitle={t(`collections.types.${item.type}`)}
            meta={`${item.customerName} \u00b7 ${item.when}`}
            footer={<StatusPill label={t(`collections.status.${item.status}`)} tone="success" />}
            onPress={() => navigateTo(`/collection/${item.id}`)}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="pt-4">
            <View className="gap-3">
              <View className="flex-row gap-3">
                <StatCard
                  label={t('collections.summary.today')}
                  value={formatCurrency(summary.today)}
                  tone={TILE}
                />
                <StatCard
                  label={t('collections.summary.week')}
                  value={formatCurrency(summary.week)}
                  tone={TILE}
                />
              </View>
              <View className="flex-row gap-3">
                <StatCard
                  label={t('collections.summary.month')}
                  value={formatCurrency(summary.month)}
                  tone={TILE}
                />
                <StatCard
                  label={t('collections.summary.total')}
                  value={formatCurrency(summary.total)}
                  tone={TILE}
                />
              </View>
            </View>

            <SectionHeading
              className="mt-7"
              title={t('collections.history')}
              action={
                <SelectPill
                  value={period}
                  onChange={setPeriod}
                  accessibilityLabel={t('collections.history')}
                  options={PERIODS.map((value) => ({
                    value,
                    label: t(`collections.periods.${value}`),
                  }))}
                />
              }
            />

            <FilterChips
              fill
              className="mb-4"
              value={filter}
              onChange={setFilter}
              options={Object.keys(FILTERS).map((value) => ({
                value,
                label: t(`collections.filters.${value}`),
              }))}
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="wallet-outline"
            title={t('collections.empty.title')}
            message={t('collections.empty.message')}
          />
        }
      />
    </View>
  );
}
