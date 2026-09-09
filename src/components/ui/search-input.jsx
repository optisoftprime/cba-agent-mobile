import { Ionicons } from '@expo/vector-icons';
import { Pressable, TextInput, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/**
 * The pill search field used above every list screen (customers, loans,
 * transactions). Shows a clear button once there's text.
 */
export function SearchInput({
  value,
  onChangeText,
  placeholder,
  onSubmitEditing,
  autoFocus = false,
  className = '',
}) {
  const { colors } = useTheme();

  return (
    <View
      className={`h-12 flex-row items-center gap-2.5 rounded-full border border-line bg-card px-4 ${className}`}>
      <Ionicons name="search" size={18} color={colors.inkSoft} />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkSoft}
        onSubmitEditing={onSubmitEditing}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        className="flex-1 text-[15px] text-ink"
      />

      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          onPress={() => onChangeText?.('')}>
          <Ionicons name="close-circle" size={18} color={colors.inkSoft} />
        </Pressable>
      ) : null}
    </View>
  );
}
