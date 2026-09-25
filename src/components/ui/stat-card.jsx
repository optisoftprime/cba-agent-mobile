import { Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/**
 * A labelled figure in a box.
 *
 * `tone` is the tile's background class ("bg-tile-1", or "bg-card border
 * border-line"). `layout` picks the two arrangements the designs use:
 *   'stacked' — label above a large value, left aligned (dashboard tiles)
 *   'count'   — value above the label, centred (support ticket counts)
 */
export function StatCard({ label, value, tone, layout = 'stacked' }) {
  const { shadows } = useTheme();

  if (layout === 'count') {
    return (
      <View
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
      </View>
    );
  }

  return (
    <View className={`flex-1 rounded-2xl px-4 py-3.5 ${tone}`} style={shadows.md}>
      <Text className="text-[13px] font-medium text-ink/70" numberOfLines={1}>
        {label}
      </Text>
      {/* A cash figure shrinks to stay on one line rather than overflow the
          tile — a big collections total was running past the edge. */}
      <Text
        className="mt-2 text-2xl font-bold text-ink"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}>
        {value}
      </Text>
    </View>
  );
}
