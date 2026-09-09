import { Ionicons } from '@expo/vector-icons';
import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getNotifications } from '@/api/mock';
import { AppHeader, NotificationsAction } from '@/components/layout/app-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ListCard } from '@/components/ui/list-card';
import { useTheme } from '@/theme/theme-provider';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const notifications = getNotifications();

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        showBack
        title={t('notifications.title')}
        subtitle={t('notifications.subtitle')}
        right={<NotificationsAction />}
      />

      <FlatList
        data={notifications}
        keyExtractor={(entry) => entry.id}
        renderItem={({ item }) => (
          <ListCard
            align="start"
            leading={
              <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-light">
                <Ionicons name="notifications-outline" size={19} color={colors.primaryDark} />
              </View>
            }
            title={item.title}
            subtitle={item.detail}
            meta={item.timestamp}
            trailing={
              item.unread ? (
                <View
                  accessibilityLabel={t('notifications.unread')}
                  className="h-2 w-2 rounded-full bg-warning"
                />
              ) : null
            }
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title={t('notifications.empty.title')}
            message={t('notifications.empty.message')}
          />
        }
      />
    </View>
  );
}
