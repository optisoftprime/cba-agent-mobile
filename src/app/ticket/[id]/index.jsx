import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Permission } from '@/api/permissions';
import { ticketQuery } from '@/api/support';
import { AppHeader } from '@/components/layout/app-header';
import { LockedScreen } from '@/components/layout/locked-screen';
import { DetailRows } from '@/components/ui/detail-rows';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SectionHeading } from '@/components/ui/section-heading';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { formatDateTime } from '@/lib/format';
import { TICKET_PRIORITY_TONE, TICKET_STATUS_TONE } from '@/lib/status';
import { usePermission } from '@/providers/permission-provider';

/** "IN_PROGRESS" / "In Progress" both need to reach the same key. */
const toneKey = (value) => String(value ?? '').toLowerCase().replace(/\s+/g, '_');

/**
 * One ticket and its thread.
 *
 * NOTE: there is no design for this screen — the tickets list has chevrons and
 * the API returns a message thread, so it is built from the existing pieces
 * (detail rows + a thread). Worth a designer's eye before it ships.
 */
export default function TicketDetailScreen() {
  const { t } = useTranslation();
  const access = usePermission(Permission.supportTickets);
  const { id } = useLocalSearchParams();

  const ticketNumber = String(id ?? '');
  const { data, isPending, isError, error, refetch, isRefetching } = useQuery(
    ticketQuery(ticketNumber),
  );

  const rows = data
    ? [
        {
          key: 'status',
          label: t('support.detail.statusLabel'),
          value: <StatusPill label={data.status} tone={TICKET_STATUS_TONE[toneKey(data.status)] ?? 'neutral'} />,
        },
        {
          key: 'priority',
          label: t('support.detail.priority'),
          value: (
            <StatusPill
              label={data.priority}
              tone={TICKET_PRIORITY_TONE[toneKey(data.priority)] ?? 'neutral'}
            />
          ),
        },
        { key: 'category', label: t('support.detail.category'), value: data.category },
        ...(data.assignedTo
          ? [{ key: 'assigned', label: t('support.detail.assignedTo'), value: data.assignedTo }]
          : []),
        {
          key: 'created',
          label: t('support.detail.created'),
          value: formatDateTime(data.createdAt),
        },
        ...(data.lastActivityAt
          ? [
              {
                key: 'activity',
                label: t('support.detail.lastActivity'),
                value: formatDateTime(data.lastActivityAt),
              },
            ]
          : []),
      ]
    : [];

  if (!access.allowed) {
    return <LockedScreen showBack title={t('support.title')} code={Permission.supportTickets} />;
  }

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        showBack
        title={data?.subject ?? t('support.detail.title')}
        subtitle={data?.ticketNumber ?? ticketNumber}
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={refetch}>
        {isPending ? (
          <View className="overflow-hidden rounded-2xl border border-line bg-card">
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                className={`flex-row items-center justify-between px-4 py-4 ${
                  i < 3 ? 'border-b border-line' : ''
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

            {data.description ? (
              <View className="mt-4 rounded-2xl border border-line bg-card p-4">
                <Text className="text-[13px] font-semibold text-ink-muted">
                  {t('support.detail.description')}
                </Text>
                <Text className="mt-2 text-[14px] leading-6 text-ink">{data.description}</Text>
              </View>
            ) : null}

            <SectionHeading className="mt-7" title={t('support.detail.thread')} />

            {data.messages?.length ? (
              data.messages.map((message, index) => {
                // The agent's own replies sit on the right, in brand colour.
                const isAgent = String(message.senderType ?? '').toUpperCase() === 'AGENT';

                return (
                  <View
                    key={`${message.sentAt}-${index}`}
                    className={`mb-3 max-w-[85%] rounded-2xl px-4 py-3 ${
                      isAgent ? 'self-end bg-primary' : 'self-start border border-line bg-card'
                    }`}>
                    <Text
                      className={`text-[12px] font-semibold ${
                        isAgent ? 'text-on-primary/80' : 'text-ink-muted'
                      }`}>
                      {message.senderName || message.senderType}
                    </Text>
                    <Text
                      className={`mt-1 text-[14px] leading-5 ${
                        isAgent ? 'text-on-primary' : 'text-ink'
                      }`}>
                      {message.body}
                    </Text>
                    <Text
                      className={`mt-1.5 text-[11px] ${
                        isAgent ? 'text-on-primary/70' : 'text-ink-soft'
                      }`}>
                      {formatDateTime(message.sentAt)}
                    </Text>
                  </View>
                );
              })
            ) : (
              <EmptyState
                compact
                icon="chatbubble-outline"
                title={t('support.detail.noMessages')}
                message={t('support.detail.noMessagesMessage')}
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
