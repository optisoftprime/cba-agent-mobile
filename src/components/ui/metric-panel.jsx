import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/**
 * A tinted strip of label/value pairs inside a card — "Outstanding ₦650,000 |
 * Next Payment ₦41,850". Columns share the width evenly, so two or three
 * metrics both lay out correctly.
 *
 * An item may carry `onPress`, which makes that column tappable and marks it
 * with a small expand glyph. That is for a SHORTENED figure ("₦499.9B"), where
 * the tap is how the agent reads the exact amount — see the dashboard. A
 * column with nothing more to show must not take one.
 */
export function MetricPanel({ items, className = '' }) {
  const { colors } = useTheme();

  return (
    <View className={`flex-row gap-3 rounded-lg bg-card-muted px-3.5 py-3 ${className}`}>
      {items.map((item) => {
        const value = (
          <>
            <Text className="text-[11px] text-ink-muted" numberOfLines={1}>
              {item.label}
            </Text>
            <View className="mt-1 flex-row items-center gap-1">
              {/* Shrink rather than truncate: a chopped "₦1,000,00" is a wrong
                  figure, a smaller "₦10,000,000" is still right. */}
              <Text
                className="shrink text-[15px] font-bold text-ink"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}>
                {item.value}
              </Text>
              {item.onPress ? (
                <Ionicons name="expand-outline" size={11} color={colors.inkMuted} />
              ) : null}
            </View>
          </>
        );

        return item.onPress ? (
          <Pressable
            key={item.label}
            className="flex-1"
            accessibilityRole="button"
            accessibilityLabel={item.pressLabel ?? item.label}
            hitSlop={6}
            onPress={item.onPress}>
            {value}
          </Pressable>
        ) : (
          <View key={item.label} className="flex-1">
            {value}
          </View>
        );
      })}
    </View>
  );
}
