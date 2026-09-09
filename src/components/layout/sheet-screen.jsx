import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Brand banner on top, white sheet with rounded top corners filling the rest —
 * the shape the login and activation screens share.
 *
 * `header` renders on the blue; `children` render inside the sheet. The sheet
 * content grows to fill, so a `<View className="flex-1" />` spacer pushes a
 * button down to the bottom edge.
 */
export function SheetScreen({ header, children }) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-primary">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ paddingTop: insets.top + 12 }} className="px-6 pb-8">
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
      </KeyboardAvoidingView>
    </View>
  );
}
