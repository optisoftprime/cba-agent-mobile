import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  markAllNotificationsRead,
  markNotificationRead,
  notificationsQuery,
  unreadCountOf,
} from '@/api/notifications';
import { itemsOf } from '@/api/pagination';
import { AppHeader, HeaderAction } from '@/components/layout/app-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterChips } from '@/components/ui/filter-chips';
import { ListCard } from '@/components/ui/list-card';
import { LoadingMore } from '@/components/ui/loading-more';
import { SkeletonCard } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/format';
import { navigateTo } from '@/lib/navigate';
import { notificationIcon, notificationRoute } from '@/lib/notifications';
import { toast } from '@/lib/toast';
import { useTheme } from '@/theme/theme-provider';
import { useRefreshWithPermissions } from '@/providers/permission-provider';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  // Chip values are strings, not booleans: a React key of `false` is not a
  // valid key, and `count` as an interpolation name makes i18next reach for
  // plural rules Hermes may not have.
  const [scope, setScope] = useState('all');
  const unreadOnly = scope === 'unread';
  const [confirmingReadAll, setConfirmingReadAll] = useState(false);

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
  } = useInfiniteQuery(notificationsQuery({ unreadOnly }));

  const onRefresh = useRefreshWithPermissions(refetch);

  const notifications = useMemo(() => itemsOf(data, 'notifications'), [data]);
  const unreadCount = unreadCountOf(data);

  // The dashboard carries its own unread count for the bell badge, so both have
  // to be refreshed or the badge keeps a number the inbox no longer agrees with.
  const refreshCounts = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const readOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: refreshCounts,
    // Marking read is incidental to the tap — the agent asked to open the
    // notification, not to file it — so a failure must not interrupt them.
    onError: () => {},
  });

  const readAll = useMutation({
    mutationFn: markAllNotificationsRead,
    // The server answers { markedRead: n } — report its number, not the one the
    // screen happened to be showing, which may be a page or two out of date.
    onSuccess: (result) => {
      refreshCounts();
      toast.success(
        t('notifications.readAll.doneTitle'),
        t('notifications.readAll.done', { total: result?.markedRead ?? 0 }),
      );
    },
    onError: (readAllError) => toast.error(readAllError.message),
  });

  const openNotification = (notification) => {
    if (!notification.read) readOne.mutate(notification.reference);

    const route = notificationRoute(notification);
    if (route) navigateTo(route);
  };

  const filters = (
    <View className="pb-4 pt-4">
      <FilterChips
        fill
        value={scope}
        onChange={setScope}
        options={[
          { value: 'all', label: t('notifications.filters.all') },
          {
            value: 'unread',
            label: unreadCount
              ? t('notifications.filters.unreadCount', { total: unreadCount })
              : t('notifications.filters.unread'),
          },
        ]}
      />
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        showBack
        title={t('notifications.title')}
        subtitle={t('notifications.subtitle')}
        right={
          unreadCount > 0 ? (
            <HeaderAction
              icon="checkmark-done-outline"
              accessibilityLabel={t('notifications.readAll.action')}
              onPress={() => setConfirmingReadAll(true)}
            />
          ) : null
        }
      />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={isPending ? [] : notifications}
          keyExtractor={(entry) => entry.reference}
          renderItem={({ item }) => (
            <ListCard
              align="start"
              leading={
                <View
                  className={`h-10 w-10 items-center justify-center rounded-full ${
                    item.read ? 'bg-card-muted' : 'bg-primary-light'
                  }`}>
                  <Ionicons
                    name={notificationIcon(item.type)}
                    size={19}
                    color={item.read ? colors.inkSoft : colors.primaryDark}
                  />
                </View>
              }
              title={item.title}
              subtitle={item.body}
              meta={formatDateTime(item.createdAt)}
              // A chevron would promise a screen that some targets don't have.
              trailing={
                item.read ? null : (
                  <View
                    accessibilityLabel={t('notifications.unread')}
                    className="h-2.5 w-2.5 rounded-full bg-primary"
                  />
                )
              }
              onPress={() => openNotification(item)}
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
          ListHeaderComponent={filters}
          ListFooterComponent={<LoadingMore active={isFetchingNextPage} />}
          ListEmptyComponent={
            isPending ? (
              <View>
                {[0, 1, 2, 3, 4].map((i) => (
                  <SkeletonCard key={i} lines={3} />
                ))}
              </View>
            ) : (
              <EmptyState
                icon="notifications-off-outline"
                title={
                  unreadOnly ? t('notifications.empty.unreadTitle') : t('notifications.empty.title')
                }
                message={
                  unreadOnly
                    ? t('notifications.empty.unreadMessage')
                    : t('notifications.empty.message')
                }
              />
            )
          }
        />
      )}

      <ConfirmDialog
        visible={confirmingReadAll}
        icon="checkmark-done-outline"
        title={t('notifications.readAll.title')}
        message={t('notifications.readAll.message', { total: unreadCount })}
        confirmLabel={t('notifications.readAll.confirm')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setConfirmingReadAll(false)}
        onConfirm={() => {
          setConfirmingReadAll(false);
          readAll.mutate();
        }}
      />
    </View>
  );
}
