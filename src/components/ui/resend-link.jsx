import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/**
 * THE "didn't get a code? resend" control. Used by both OTP screens (device
 * activation and password reset), so they behave identically.
 *
 * It has three states and shows all of them, which is the whole point:
 *
 *   cooling down  "Resend in 42s" — plain text, nothing to press
 *   sending       a spinner beside a dimmed label, and not pressable
 *   ready         the link
 *
 * The middle state is why this exists. A resend takes a second or two on a
 * field connection, and a link that does not visibly react is a link the agent
 * taps again, and again. The handler already refuses a second call, so no
 * duplicate code goes out — but the agent has no way to know that, and being
 * left wondering whether it worked is the failure, not the extra request.
 */
export function ResendLink({
  prompt,
  action,
  countdown,
  secondsLeft = 0,
  loading = false,
  onPress,
  className = '',
}) {
  const { colors } = useTheme();
  const cooling = secondsLeft > 0;

  return (
    <View className={`flex-row flex-wrap items-center gap-1.5 ${className}`}>
      {prompt ? <Text className="text-[14px] text-ink-muted">{prompt}</Text> : null}

      {cooling ? (
        <Text className="text-[14px] font-medium text-ink-soft">{countdown}</Text>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action}
          accessibilityState={{ disabled: loading, busy: loading }}
          disabled={loading}
          hitSlop={8}
          onPress={onPress}
          className="flex-row items-center gap-1.5">
          {loading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
          <Text className={`text-[14px] font-semibold text-primary ${loading ? 'opacity-60' : ''}`}>
            {action}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
