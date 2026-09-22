import { Image, Text, View } from 'react-native';

import { brand } from '@/theme/brand';
import { useTheme } from '@/theme/theme-provider';

/**
 * The app's mark and wordmark, both driven by `src/theme/brand.js`. A new
 * client sets `appName` and `logo` there; nothing here changes.
 *
 * `size` is the logo's HEIGHT. The width comes from the asset's own aspect
 * ratio, read at runtime — a square mark and a wide lockup both render
 * correctly without anyone editing this file. Squeezing a 2.47:1 lockup into a
 * square box is how a logo ends up looking shrunken and off-centre.
 *
 * A lockup usually contains the wordmark already, so the `appName` text is NOT
 * printed underneath one — that would show the name twice. The text only
 * appears with the monogram fallback, which is what renders when no `logo`
 * asset is set, so the splash is never blank.
 */
const TONES = {
  /** On the brand colour — the splash screen. */
  onPrimary: { mark: 'bg-on-primary', letter: 'text-primary', name: 'text-on-primary' },
  /** On a light surface — the receipt. */
  brand: { mark: 'bg-primary', letter: 'text-on-primary', name: 'text-ink' },
};

export function BrandLogo({ size = 88, showName = true, tone = 'onPrimary' }) {
  const { mark, letter, name } = TONES[tone] ?? TONES.onPrimary;
  const { isDark } = useTheme();
  // The white-wordmark file in dark mode — see `logo` in brand.js.
  const source = brand.logo ? (isDark ? brand.logo.dark : brand.logo.light) : null;

  // resolveAssetSource gives the asset's real pixel dimensions, so the aspect
  // ratio follows whatever file brand.js points at.
  const asset = source ? Image.resolveAssetSource(source) : null;
  const aspect = asset?.width && asset?.height ? asset.width / asset.height : 1;

  if (source) {
    return (
      <View className="items-center">
        <Image
          source={source}
          // maxWidth so a wide lockup shrinks to fit a narrow phone rather
          // than running off the edge; `contain` keeps the aspect while it does.
          style={{ width: size * aspect, height: size, maxWidth: '100%' }}
          resizeMode="contain"
          accessibilityLabel={brand.appName}
        />
      </View>
    );
  }

  return (
    <View className="items-center">
      <View
        style={{ width: size, height: size, borderRadius: size / 2 }}
        className={`items-center justify-center ${mark}`}>
        <Text style={{ fontSize: size * 0.44 }} className={`font-bold ${letter}`}>
          {brand.appName.charAt(0).toUpperCase()}
        </Text>
      </View>

      {showName ? (
        <Text className={`mt-4 text-[15px] font-bold tracking-[3px] ${name}`}>
          {brand.appName.toUpperCase()}
        </Text>
      ) : null}
    </View>
  );
}
