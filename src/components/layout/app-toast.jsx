import Toast, { BaseToast } from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme-provider';

/**
 * The app's toast host, themed from the palette.
 *
 * Same library and same fix as Rize Spring: BaseToast defaults to a FIXED ~60px
 * height, which clips the second and third line even when wrapping is allowed.
 * Letting the height grow (height: undefined + minHeight) is what makes a full
 * three-line server message readable. Unlike Rize Spring, the colours come from
 * brand.js, so they follow a re-brand and dark mode.
 */
export function AppToast() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const render = (accent) =>
    function ThemedToast(props) {
      return (
        <BaseToast
          {...props}
          text1NumberOfLines={2}
          text2NumberOfLines={3}
          style={{
            borderLeftColor: accent,
            borderLeftWidth: 5,
            backgroundColor: colors.card,
            height: undefined,
            minHeight: 60,
            paddingVertical: 10,
            width: '92%',
          }}
          contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 2 }}
          // text2 is deliberately a step smaller than text1: the heading is what
          // gets read while the toast slides past, the detail is for whoever
          // stops to read it.
          text1Style={{ fontSize: 14, fontWeight: '600', color: colors.ink }}
          text2Style={{ fontSize: 12, lineHeight: 17, color: colors.inkMuted }}
        />
      );
    };

  const config = {
    success: render(colors.success),
    error: render(colors.danger),
    info: render(colors.info),
  };

  return <Toast config={config} topOffset={insets.top + 8} />;
}
