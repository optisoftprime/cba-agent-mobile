import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppHeader } from '@/components/layout/app-header';
import { PreferencesModal } from '@/components/layout/preferences-modal';
import { Avatar } from '@/components/ui/avatar';
import { ListCard } from '@/components/ui/list-card';
import { LANGUAGES } from '@/i18n';
import { agentSubtitle, agentView } from '@/lib/agent';
import { navigateTo } from '@/lib/navigate';
import { useAuth } from '@/providers/auth-provider';
import { useTheme } from '@/theme/theme-provider';

export default function MoreScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark, toggleTheme } = useTheme();

  const agent = agentView(useAuth().user);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const language = LANGUAGES.find((entry) => entry.code === i18n.language)?.label;

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

        {/* The row itself toggles as well as the switch — a thin switch is a
            small target for someone working one-handed in the field. */}
        <ListCard
          leading={
            <Ionicons
              name={isDark ? 'moon-outline' : 'sunny-outline'}
              size={20}
              color={colors.ink}
            />
          }
          title={t('profile.more.darkMode')}
          subtitle={isDark ? t('profile.more.darkOn') : t('profile.more.darkOff')}
          onPress={toggleTheme}
          trailing={
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              accessibilityLabel={t('profile.more.darkMode')}
              trackColor={{ false: colors.line, true: colors.primary }}
              thumbColor={colors.card}
            />
          }
        />

        <ListCard
          leading={<Ionicons name="language-outline" size={20} color={colors.ink} />}
          title={t('profile.more.preferences')}
          subtitle={language}
          onPress={() => setPreferencesOpen(true)}
        />
      </ScrollView>

      <PreferencesModal visible={preferencesOpen} onClose={() => setPreferencesOpen(false)} />
    </View>
  );
}
