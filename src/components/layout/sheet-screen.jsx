import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { navigateBack } from '@/lib/navigate';
import { useTheme } from '@/theme/theme-provider';

/**
 * Brand banner on top, white sheet with rounded top corners filling the rest —
 * the shape the login and activation screens share.
 *
 * `header` renders on the blue; `children` render inside the sheet. The sheet
 * content grows to fill, so a `<View className="flex-1" />` spacer pushes a
 * button down to the bottom edge.
 *
 * `showBack` puts the back arrow in the blue banner, above the header text.
 * Leave it off for a screen that ends a process — pair that with NoGoingBack.
 */import { KeyboardView } from '@/components/layout/keyboard-view';

export function SheetScreen({ header, children, showBack = false, onBackPress }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-primary">
      <KeyboardView>
        <View style={{ paddingTop: insets.top + 12 }} className="px-6 pb-8">
          {showBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              hitSlop={12}
              onPress={() => (onBackPress ? onBackPress() : navigateBack('/(auth)/login'))}
              className="-ml-2 mb-4 h-10 w-10 items-center justify-center">
              <Ionicons name="arrow-back" size={24} color={colors.onPrimary} />
            </Pressable>
          ) : null}

          {header}
        </View>

        <View className="flex-1 overflow-hidden rounded-t-[28px] bg-card">
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 24,
              paddingTop: 28,
              paddingBottom: Math.max(insets.bottom, 20),
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </KeyboardView>
    </View>
  );
}
