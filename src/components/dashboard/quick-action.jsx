import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

export function QuickAction({ label, icon, onPress }) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-1 items-center rounded-xl border border-line bg-card py-3 active:bg-card-muted">
      <View className="h-7 items-center justify-center">
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <Text className="mt-1.5 text-[11px] font-medium text-ink">{label}</Text>
    </Pressable>
  );
}
