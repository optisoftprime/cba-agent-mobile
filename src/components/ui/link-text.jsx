import { Pressable, Text, View } from 'react-native';

/**
 * The "Don't have X? Do Y" line under an auth form. `prompt` is optional, so it
 * also covers a bare link on its own.
 */
export function LinkText({ prompt, action, onPress, className = '' }) {
  return (
    <View className={`flex-row items-center justify-center gap-1.5 ${className}`}>
      {prompt ? <Text className="text-[13px] text-ink-muted">{prompt}</Text> : null}
      <Pressable accessibilityRole="link" onPress={onPress} hitSlop={8}>
        <Text className="text-[13px] font-semibold text-primary">{action}</Text>
      </Pressable>
    </View>
  );
}
