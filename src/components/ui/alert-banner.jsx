import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

const TONES = {
  warning: { box: 'bg-warning-soft', text: 'text-on-warning-soft', icon: 'warning-outline' },
  danger: { box: 'bg-danger-soft', text: 'text-on-danger-soft', icon: 'alert-circle-outline' },
  info: { box: 'bg-info-soft', text: 'text-on-info-soft', icon: 'information-circle-outline' },
};

const ICON_COLOR = { warning: 'onWarningSoft', danger: 'onDangerSoft', info: 'onInfoSoft' };

/**
 * An in-page notice the agent needs to read before acting — a reconciliation
 * hold, say. Not a toast: a toast disappears, and a condition that blocks work
 * has to stay on screen while it lasts.
 *
 * Pass `onPress` (and `actionLabel`) when there is something the agent can DO
 * about it — the hold banner opens End of day, which is what lifts the hold. A
 * notice that names a problem but gives no way to fix it just leaves them
 * hunting for the screen.
 */
export function AlertBanner({
  tone = 'warning',
  title,
  message,
  actionLabel,
  onPress,
  className = '',
}) {
  const { colors } = useTheme();
  const style = TONES[tone] ?? TONES.warning;
  const iconColor = colors[ICON_COLOR[tone] ?? 'onWarningSoft'];
  const Container = onPress ? Pressable : View;

  return (
    <Container
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      className={`flex-row gap-3 rounded-xl px-4 py-3.5 ${style.box} ${
        onPress ? 'active:opacity-80' : ''
      } ${className}`}>
      <Ionicons name={style.icon} size={20} color={iconColor} />

      <View className="flex-1">
        <Text className={`text-[14px] font-semibold ${style.text}`}>{title}</Text>
        {message ? (
          <Text className={`mt-1 text-[13px] leading-5 ${style.text} opacity-90`}>{message}</Text>
        ) : null}
        {onPress && actionLabel ? (
          <Text className={`mt-2 text-[13px] font-semibold ${style.text}`}>{actionLabel}</Text>
        ) : null}
      </View>

      {onPress ? <Ionicons name="chevron-forward" size={18} color={iconColor} /> : null}
    </Container>
  );
}
