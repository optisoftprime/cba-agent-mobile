import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/**
 * A labelled figure in a box.
 *
 * `tone` is the tile's background class ("bg-tile-1", or "bg-card border
 * border-line"). `layout` picks the two arrangements the designs use:
 *   'stacked' — label above a large value, left aligned (dashboard tiles)
 *   'count'   — value above the label, centred (support ticket counts)
 *
 * `onPress` makes the tile tappable and adds a small expand glyph beside the
 * label. It is for a SHORTENED figure ("₦4.32M") whose exact amount the tap
 * reveals — a tile showing a complete number should not take one.
 */
export function StatCard({ label, value, tone, layout = 'stacked', onPress, pressLabel }) {
  const { shadows, colors } = useTheme();
  const Box = onPress ? Pressable : View;
  const pressProps = onPress
    ? { onPress, accessibilityRole: 'button', accessibilityLabel: pressLabel ?? label }
    : null;

  if (layout === 'count') {
    return (
      <Box
        {...pressProps}
        className={`flex-1 items-center rounded-2xl px-3 py-4 ${tone}`}
        style={shadows.sm}>
        <Text
          className="text-[22px] font-bold text-ink"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}>
          {value}
        </Text>
        <Text className="mt-1 text-[13px] text-ink-muted" numberOfLines={1}>
          {label}
        </Text>
      </Box>
    );
  }

  return (
    <Box {...pressProps} className={`flex-1 rounded-2xl px-4 py-3.5 ${tone}`} style={shadows.md}>
      <View className="flex-row items-center gap-1">
        <Text className="shrink text-[13px] font-medium text-ink/70" numberOfLines={1}>
          {label}
        </Text>
        {/* The glyph sits by the LABEL, not the figure: the figure is already
            the biggest thing in the tile and an icon beside it reads as part
            of the number. */}
        {onPress ? <Ionicons name="expand-outline" size={12} color={colors.inkMuted} /> : null}
      </View>
      {/* A cash figure shrinks to stay on one line rather than overflow the
          tile — a big collections total was running past the edge. */}
      <Text
        className="mt-2 text-2xl font-bold text-ink"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}>
        {value}
      </Text>
    </Box>
  );
}
