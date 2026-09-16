import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/ui/avatar';
import { navigateBack, navigateTo } from '@/lib/navigate';
import { useTheme } from '@/theme/theme-provider';

/**
 * The blue banner at the top of every primary screen.
 *
 * Covers the two shapes in the designs:
 *   • title + subtitle + a right action        (My Customers, 5 assigned, bell)
 *   • a leading node + title + subtitle        (dashboard: avatar + greeting)
 *
 * Props:
 *   title, subtitle  — the two lines of text
 *   leading          — node rendered before the text (an avatar, say)
 *   showBack         — render a back chevron before the text
 *   right            — node rendered at the far right (usually <HeaderAction/>)
 *   overlap          — extra bottom padding so the content below can pull up
 *                      over the banner with a negative margin
 *   children         — rendered inside the banner, under the title row
 */
export function AppHeader({
  title,
  subtitle,
  leading = null,
  showBack = false,
  right = null,
  overlap = false,
  children = null,
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <SafeAreaView edges={['top']} className="bg-primary">
      <View className={`px-5 pt-3 ${overlap ? 'pb-16' : 'pb-5'}`}>
        <View className="flex-row items-center gap-3">
          {showBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              hitSlop={10}
              onPress={() => navigateBack()}>
              <Ionicons name="arrow-back" size={23} color={colors.onPrimary} />
            </Pressable>
          ) : null}

          {leading}

          <View className="flex-1">
            <Text className="text-[17px] font-bold text-on-primary" numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text className="mt-0.5 text-xs text-on-primary/80" numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>

          {right}
        </View>

        {children ? <View className="mt-4">{children}</View> : null}
      </View>
    </SafeAreaView>
  );
}

/** Icon button sized and coloured for the header's right slot. */
export function HeaderAction({ icon, onPress, accessibilityLabel }) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={10}
      onPress={onPress}>
      <Ionicons name={icon} size={23} color={colors.onPrimary} />
    </Pressable>
  );
}

/** Circular avatar for the header's leading slot, toned for the brand banner. */
export function HeaderAvatar({ name = '', uri }) {
  return <Avatar name={name} uri={uri} tone="inverse" />;
}

/**
 * The bell. Dashboard only — see AGENTS.md.
 *
 * `count` shows unread notifications as a badge; anything over 9 reads "9+"
 * so a big number can't stretch the dot out of shape.
 */
export function NotificationsAction({ count = 0 }) {
  const { t } = useTranslation();
  const unread = Number(count) || 0;

  return (
    <View>
      <HeaderAction
        icon="notifications-outline"
        accessibilityLabel={
          unread > 0 ? t('common.notificationsUnread', { count: unread }) : t('common.notifications')
        }
        onPress={() => navigateTo('/notifications')}
      />

      {unread > 0 ? (
        <View className="absolute -right-1.5 -top-1 min-w-[18px] items-center justify-center rounded-full bg-danger px-1">
          <Text className="text-[10px] font-bold text-on-danger">
            {unread > 9 ? '9+' : unread}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
