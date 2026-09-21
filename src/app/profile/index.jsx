import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppHeader } from '@/components/layout/app-header';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DetailRows } from '@/components/ui/detail-rows';
import { StatusPill } from '@/components/ui/status-pill';
import { agentView } from '@/lib/agent';
import { navigateReplace, navigateTo } from '@/lib/navigate';
import { CUSTOMER_STATUS_TONE } from '@/lib/status';
import { useAuth } from '@/providers/auth-provider';
import { useTheme } from '@/theme/theme-provider';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { shadows } = useTheme();
  const { user, signOut } = useAuth();

  const agent = agentView(user);

  // The server can report a status the locale files have no wording for; show
  // its own word rather than a raw translation key.
  const statusLabel = agent?.statusKey ? t(`profile.status.${agent.statusKey}`) : agent?.statusLabel;

  const rows = [
    { key: 'phone', label: t('profile.phone'), value: agent?.phone },
    { key: 'email', label: t('profile.email'), value: agent?.email },
    { key: 'branch', label: t('profile.branch'), value: agent?.branch },
    { key: 'role', label: t('profile.role'), value: agent?.role },
    {
      key: 'status',
      label: t('profile.statusLabel'),
      value: statusLabel,
    },
    // A labelled row with nothing beside it reads as broken. If the server
    // omits a field, drop the row rather than show an empty one.
  ].filter((row) => row.value);

  const onLogout = async () => {
    try {
      await signOut();
    } finally {
      // Leaving is not conditional on anything succeeding.
      navigateReplace('/(auth)/login');
    }
  };

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        showBack
        title={t('profile.title')}
        subtitle={t('profile.more.subtitle')}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}>
        <View
          style={shadows.sm}
          className="items-center rounded-2xl border border-line bg-card px-5 py-7">
          <Avatar name={agent?.name} size={72} />
          <Text className="mt-4 text-[19px] font-bold text-ink">{agent?.name ?? ''}</Text>
          <Text className="mt-1 text-[13px] text-ink-muted">{agent?.code ?? ''}</Text>
          <View className="mt-3">
            <StatusPill
              label={statusLabel}
              tone={CUSTOMER_STATUS_TONE[agent?.statusKey] ?? 'neutral'}
            />
          </View>
        </View>

        <DetailRows rows={rows} className="mt-4" />

        {/* Pushes the actions to the bottom when the card list is short. */}
        <View className="min-h-8 flex-1" />

        <View className="gap-3">
          <Button
            variant="outline"
            size="lg"
            icon="lock-closed-outline"
            label={t('profile.changePassword')}
            onPress={() => navigateTo('/change-password')}
          />
          <Button
            variant="danger"
            size="lg"
            icon="log-out-outline"
            label={t('profile.logout')}
            onPress={onLogout}
          />
        </View>
      </ScrollView>
    </View>
  );
}
