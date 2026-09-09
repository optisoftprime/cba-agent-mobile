import { Ionicons } from '@expo/vector-icons';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getAgent } from '@/api/mock';
import { AppHeader, NotificationsAction } from '@/components/layout/app-header';
import { Avatar } from '@/components/ui/avatar';
import { ListCard } from '@/components/ui/list-card';
import { navigateTo } from '@/lib/navigate';
import { useTheme } from '@/theme/theme-provider';

export default function MoreScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const agent = getAgent();

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        title={t('profile.more.title')}
        subtitle={t('profile.more.subtitle')}
        right={<NotificationsAction />}
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}>
        <ListCard
          leading={<Avatar name={agent.name} />}
          title={agent.name}
          subtitle={`${agent.code} \u00b7 ${agent.role}`}
          trailing={null}
        />

        <ListCard
          leading={<Ionicons name="person-outline" size={20} color={colors.ink} />}
          title={t('profile.more.profile')}
          onPress={() => navigateTo('/profile')}
        />
      </ScrollView>
    </View>
  );
}
