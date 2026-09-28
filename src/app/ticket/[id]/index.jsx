import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Permission } from '@/api/permissions';
import { closeTicket, replyToTicket, ticketQuery } from '@/api/support';
import { AppHeader } from '@/components/layout/app-header';
import { KeyboardView } from '@/components/layout/keyboard-view';
import { LockedScreen } from '@/components/layout/locked-screen';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DetailRows } from '@/components/ui/detail-rows';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SectionHeading } from '@/components/ui/section-heading';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { TextField } from '@/components/ui/text-field';
import { formatDateTime } from '@/lib/format';
import { TICKET_PRIORITY_TONE, TICKET_STATUS_TONE } from '@/lib/status';
import { toast } from '@/lib/toast';
import { usePermission, useRefreshWithPermissions } from '@/providers/permission-provider';

/** "IN_PROGRESS" / "In Progress" both need to reach the same key. */
const toneKey = (value) => String(value ?? '').toLowerCase().replace(/\s+/g, '_');

/** A closed ticket takes no more replies; a resolved one can be reopened by one. */
const isClosed = (status) => String(status ?? '').toUpperCase() === 'CLOSED';

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

  const onRefresh = useRefreshWithPermissions(refetch);
  const queryClient = useQueryClient();

  const [reply, setReply] = useState('');
  const [confirmingClose, setConfirmingClose] = useState(false);

  // Reply and close both answer with the whole ticket and its thread, so the
  // screen updates from the response — no refetch — and the list's counts,
  // which the ticket screen does not show, are invalidated to catch up.
  const applyTicket = (ticket) => {
    if (ticket) queryClient.setQueryData(['ticket', ticketNumber], ticket);
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
  };

  const sendReply = useMutation({
    mutationFn: () => replyToTicket({ ticketNumber, message: reply.trim() }),
    onSuccess: (ticket) => {
      applyTicket(ticket);
      setReply('');
    },
    onError: (replyError) => toast.error(replyError.message),
  });

  const close = useMutation({
    mutationFn: () => closeTicket(ticketNumber),
    onSuccess: (ticket) => {
      applyTicket(ticket);
      toast.success(t('support.detail.closedTitle'), t('support.detail.closedMessage'));
    },
    onError: (closeError) => toast.error(closeError.message),
  });

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

      <KeyboardView>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}>
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

            {/* A closed ticket takes no reply and cannot be closed again. */}
            {isClosed(data.status) ? (
              <View className="mt-4 rounded-2xl border border-line bg-card-muted p-4">
                <Text className="text-center text-[13px] text-ink-muted">
                  {t('support.detail.closedNote')}
                </Text>
              </View>
            ) : (
              <View className="mt-6 gap-3">
                <TextField
                  label={t('support.detail.replyLabel')}
                  placeholder={t('support.detail.replyPlaceholder')}
                  value={reply}
                  onChangeText={setReply}
                  multiline
                  editable={!sendReply.isPending}
                />
                <Button
                  label={t('support.detail.send')}
                  icon="send"
                  loading={sendReply.isPending}
                  disabled={!reply.trim()}
                  onPress={() => sendReply.mutate()}
                />
                <Button
                  variant="outline"
                  label={t('support.detail.close')}
                  loading={close.isPending}
                  onPress={() => setConfirmingClose(true)}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
      </KeyboardView>

      <ConfirmDialog
        visible={confirmingClose}
        icon="checkmark-done-outline"
        title={t('support.detail.closeConfirm.title')}
        message={t('support.detail.closeConfirm.message')}
        confirmLabel={t('support.detail.closeConfirm.confirm')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setConfirmingClose(false)}
        onConfirm={() => {
          setConfirmingClose(false);
          close.mutate();
        }}
      />
    </View>
  );
}
