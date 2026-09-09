import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

/**
 * Boxed activation-code entry.
 *
 * One real TextInput sits invisibly over the boxes and holds the value — that
 * keeps paste, backspace and the OS SMS-autofill working, which a box-per-input
 * implementation always breaks.
 */
export function OtpInput({ value = '', onChange, length = 6, autoFocus = false }) {
  const inputRef = useRef(null);

  const handleChange = (next) => {
    // Digits only; the keyboard type is a hint, not a guarantee (and paste ignores it).
    onChange?.(next.replace(/\D/g, '').slice(0, length));
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
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        caretHidden
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        style={[StyleSheet.absoluteFill, { opacity: 0 }]}
      />
    </Pressable>
  );
}
