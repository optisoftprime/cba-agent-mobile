import { Image, Text, View } from 'react-native';

import { brand } from '@/theme/brand';

/**
 * The app's mark and wordmark, both driven by `src/theme/brand.js`. A new
 * client sets `appName` and `logo` there; nothing here changes.
 *
 * With no `logo` asset yet it renders a monogram from the first letter of
 * `appName`, so the splash screen always shows something deliberate.
 */
const TONES = {
  /** On the brand colour — the splash screen. */
  onPrimary: { mark: 'bg-on-primary', letter: 'text-primary', name: 'text-on-primary' },
  /** On a light surface — the receipt. */
  brand: { mark: 'bg-primary', letter: 'text-on-primary', name: 'text-ink' },
};

export function BrandLogo({ size = 88, showName = true, tone = 'onPrimary' }) {
  const { mark, letter, name } = TONES[tone] ?? TONES.onPrimary;

  return (
    <View className="items-center">
      {brand.logo ? (
        <Image
          source={brand.logo}
          style={{ width: size, height: size }}
          resizeMode="contain"
          accessibilityLabel={brand.appName}
        />
      ) : (
        <View
          style={{ width: size, height: size, borderRadius: size / 2 }}
          className={`items-center justify-center ${mark}`}>
          <Text style={{ fontSize: size * 0.44 }} className={`font-bold ${letter}`}>
            {brand.appName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {showName ? (
        <Text className={`mt-4 text-[15px] font-bold tracking-[3px] ${name}`}>
          {brand.appName.toUpperCase()}
        </Text>
      ) : null}
    </View>
  );
}
