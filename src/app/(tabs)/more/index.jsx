import { Ionicons } from '@expo/vector-icons';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppHeader } from '@/components/layout/app-header';
import { Avatar } from '@/components/ui/avatar';
import { ListCard } from '@/components/ui/list-card';
import { agentSubtitle, agentView } from '@/lib/agent';
import { navigateTo } from '@/lib/navigate';
import { useAuth } from '@/providers/auth-provider';
import { useTheme } from '@/theme/theme-provider';

export default function MoreScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const agent = agentView(useAuth().user);

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        title={t('profile.more.title')}
        subtitle={t('profile.more.subtitle')}
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}>
        <ListCard
          leading={<Avatar name={agent?.name} />}
          title={agent?.name ?? ''}
          subtitle={agentSubtitle(agent)}
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
