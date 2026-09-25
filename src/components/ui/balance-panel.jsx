import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/**
 * The headline figure on a screen — collected today, a loan's outstanding
 * balance — on a blue gradient so it reads as the thing worth looking at.
 *
 * The gradient stops are `panelFrom` / `panelTo` in src/theme/brand.js, passed
 * as real colours because LinearGradient takes values, not classes. Text on it
 * uses `on-panel`, which the palette keeps legible against both stops.
 */
export function BalancePanel({ label, value, footerLeft, footerRight, className = '' }) {
  const { colors } = useTheme();

  return (
    <LinearGradient
      colors={[colors.panelFrom, colors.panelTo]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 16 }}
      className={className}>
      <View className="px-5 py-4">
        <Text className="text-[13px] text-on-panel/75" numberOfLines={1}>
          {label}
        </Text>
        {/* The headline figure shrinks to fit rather than overflow: a large
            balance must stay whole and on one line. */}
        <Text
          className="mt-1.5 text-[28px] font-bold text-on-panel"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}>
          {value}
        </Text>

        {footerLeft || footerRight ? (
          <View className="mt-2 flex-row items-center justify-between gap-3">
            <Text className="shrink text-[13px] text-on-panel/75" numberOfLines={1}>
              {footerLeft}
            </Text>
            <Text className="shrink text-[13px] text-on-panel/75" numberOfLines={1}>
              {footerRight}
            </Text>
          </View>
        ) : null}
      </View>
    </LinearGradient>
  );
}
