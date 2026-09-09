import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/**
 * Segmented control — a muted track with the selected item raised as a white
 * pill. Distinct from FilterChips (which fills the selected chip with the brand
 * colour); the designs use both, so both exist.
 *
 * Options share the width evenly, so this is for a small fixed set of tabs.
 */
export function SegmentedTabs({ options, value, onChange, className = '' }) {
  const { shadows } = useTheme();

  return (
    <View className={`flex-row rounded-full bg-card-muted p-1 ${className}`}>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange?.(option.value)}
            style={selected ? shadows.sm : undefined}
            className={`h-10 flex-1 items-center justify-center rounded-full ${
              selected ? 'bg-card' : ''
            }`}>
            <Text
              numberOfLines={1}
              className={`text-[14px] ${
                selected ? 'font-semibold text-ink' : 'font-medium text-ink-muted'
              }`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
