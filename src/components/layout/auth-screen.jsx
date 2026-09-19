import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KeyboardView } from '@/components/layout/keyboard-view';
import { LinkText } from '@/components/ui/link-text';
import { navigateBack } from '@/lib/navigate';
import { useTheme } from '@/theme/theme-provider';

/**
 * Shared shell for the auth screens (login, register device, forgot password).
 * Keeps the title/subtitle rhythm and the footer link identical across all
 * three, and keeps the form clear of the keyboard.
 *
 * Uses React Native's own KeyboardAvoidingView rather than a third-party
 * keyboard package — these are the first screens a user ever sees, so they get
 * the dependency that ships with the platform.
 *
 * Props:
 *   align     'center' fills the screen (login); 'top' sits the content just
 *             under the header, for the short forms.
 *   showBack  a back arrow in the top-left, for screens reached from another —
 *             a second way out that doesn't rely on spotting the footer link.
 *   footer    { prompt, action, onPress } → "Device not registered? Register device"
 */
export function AuthScreen({
  title,
  subtitle,
  children,
  footer = null,
  align = 'center',
  showBack = false,
  onBackPress,
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <SafeAreaView className="flex-1 bg-card">
      <KeyboardView>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          {showBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              hitSlop={12}
              onPress={() => (onBackPress ? onBackPress() : navigateBack('/(auth)/login'))}
              className="-ml-1 h-11 w-11 items-start justify-center">
              <Ionicons name="arrow-back" size={24} color={colors.ink} />
            </Pressable>
          ) : null}

          <View className={`flex-1 ${align === 'top' ? 'justify-start pt-2' : 'justify-center py-10'}`}>
            <Text className="text-[26px] font-bold text-ink">{title}</Text>
            {subtitle ? (
              <Text className="mt-2 text-[15px] leading-6 text-ink-muted">{subtitle}</Text>
            ) : null}

            <View className="mt-8">{children}</View>
          </View>

          {footer ? <LinkText {...footer} className="pb-2 pt-4" /> : null}
        </ScrollView>
      </KeyboardView>
    </SafeAreaView>
  );
}
