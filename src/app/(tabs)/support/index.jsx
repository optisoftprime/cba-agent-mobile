import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getTicketCounts, getTickets } from '@/api/mock';
import { AppHeader, NotificationsAction } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ListCard } from '@/components/ui/list-card';
import { SectionHeading } from '@/components/ui/section-heading';
import { StatCard } from '@/components/ui/stat-card';
import { navigateTo } from '@/lib/navigate';
import { TICKET_STATUS_TONE } from '@/lib/status';

export default function SupportScreen() {
  const { t } = useTranslation();

  const tickets = getTickets();
  const counts = getTicketCounts();

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        title={t('support.title')}
        subtitle={t('support.subtitle')}
        right={<NotificationsAction />}
      />

      <FlatList
        data={tickets}
        keyExtractor={(ticket) => ticket.id}
        renderItem={({ item }) => (
          <ListCard
            overline={item.id}
            title={item.subject}
            meta={`${item.category} - ${item.date}`}
            status={{
              label: t(`support.status.${item.status}`),
              tone: TICKET_STATUS_TONE[item.status] ?? 'neutral',
            }}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View className="flex-row gap-3">
              <StatCard
                layout="count"
                label={t('support.counts.open')}
                value={String(counts.open)}
                tone="bg-card border border-line"
              />
              <StatCard
                layout="count"
                label={t('support.counts.inProgress')}
                value={String(counts.inProgress)}
                tone="bg-card border border-line"
              />
              <StatCard
                layout="count"
                label={t('support.counts.resolved')}
                value={String(counts.resolved)}
                tone="bg-card border border-line"
              />
            </View>

            <Button
              className="mb-7 mt-5"
              label={t('support.createTicket')}
              icon="add"
              size="lg"
              onPress={() => navigateTo('/ticket/create')}
            />

            <SectionHeading title={t('support.myTickets')} />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="chatbubble-ellipses-outline"
            title={t('support.empty.title')}
            message={t('support.empty.message')}
          />
        }
      />
    </View>
  );
}
