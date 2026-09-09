import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

export function EmptyState({ icon = 'file-tray-outline', title, message }) {
  const { colors } = useTheme();

  return (
    <View className="items-center px-8 py-16">
      <Ionicons name={icon} size={40} color={colors.inkSoft} />
      <Text className="mt-4 text-center text-[15px] font-semibold text-ink">{title}</Text>
      {message ? (
        <Text className="mt-1.5 text-center text-[13px] leading-5 text-ink-muted">{message}</Text>
      ) : null}
    </View>
  );
}
