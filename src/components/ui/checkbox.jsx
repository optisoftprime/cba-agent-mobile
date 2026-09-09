import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

export function Checkbox({ checked, onChange, label, className = '' }) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => onChange?.(!checked)}
      className={`flex-row items-center gap-2 ${className}`}>
      <Ionicons
        name={checked ? 'checkbox' : 'square-outline'}
        size={20}
        color={checked ? colors.primary : colors.inkSoft}
      />
      {label ? <Text className="text-[13px] text-ink-muted">{label}</Text> : null}
    </Pressable>
  );
}
