import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

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
 */
export function AlertBanner({ tone = 'warning', title, message, className = '' }) {
  const { colors } = useTheme();
  const style = TONES[tone] ?? TONES.warning;

  return (
    <View className={`flex-row gap-3 rounded-xl px-4 py-3.5 ${style.box} ${className}`}>
      <Ionicons name={style.icon} size={20} color={colors[ICON_COLOR[tone] ?? 'onWarningSoft']} />

      <View className="flex-1">
        <Text className={`text-[14px] font-semibold ${style.text}`}>{title}</Text>
        {message ? (
          <Text className={`mt-1 text-[13px] leading-5 ${style.text} opacity-90`}>{message}</Text>
        ) : null}
      </View>
    </View>
  );
}
