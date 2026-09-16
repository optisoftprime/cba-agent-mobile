import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

/**
 * Boxed code entry — activation codes and OTPs.
 *
 * One real TextInput sits invisibly over the boxes and holds the value — that
 * keeps paste, backspace and the OS SMS-autofill working, which a box-per-input
 * implementation always breaks.
 */
export function OtpInput({
  value = '',
  onChange,
  length = 6,
  type = 'numeric',
  autoFocus = false,
  editable = true,
}) {
  const inputRef = useRef(null);
  const numeric = type === 'numeric';

  const handleChange = (next) => {
    // Filter here: the keyboard type is only a hint, and paste ignores it.
    const cleaned = numeric
      ? next.replace(/\D/g, '')
      : next.replace(/[^a-z0-9]/gi, '').toUpperCase();
    onChange?.(cleaned.slice(0, length));
  };

  return (
    <Pressable
      accessibilityRole="none"
      onPress={() => inputRef.current?.focus()}
      className="flex-row gap-2.5">
      {Array.from({ length }).map((_, index) => {
        const digit = value[index] ?? '';
        const filled = digit !== '';

        return (
          <View
            key={index}
            className={`h-14 flex-1 items-center justify-center rounded-xl ${
              filled ? 'bg-primary' : 'border border-line bg-card'
            }`}>
            <Text className={`text-[20px] font-bold ${filled ? 'text-on-primary' : 'text-ink'}`}>
              {digit}
            </Text>
          </View>
        );
      })}

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType={numeric ? 'number-pad' : 'default'}
        autoCapitalize={numeric ? 'none' : 'characters'}
        autoCorrect={false}
        maxLength={length}
        autoFocus={autoFocus}
        editable={editable}
        caretHidden
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        style={[StyleSheet.absoluteFill, { opacity: 0 }]}
      />
    </Pressable>
  );
}
