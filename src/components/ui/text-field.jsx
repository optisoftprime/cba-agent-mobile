import { forwardRef } from 'react';
import { Text, TextInput, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/**
 * Labelled text input.
 *
 * `right` renders a node inside the field (a show/hide toggle, a clear button).
 * `multiline` switches to a rounded box that grows, for longer answers — the
 * pill shape only reads correctly on a single line.
 */
export const TextField = forwardRef(function TextField(
  { label, error, hint, right = null, multiline = false, minHeight = 120, className = '', ...rest },
  ref,
) {
  const { colors } = useTheme();
  // A field that cannot be typed into should not look like one that can —
  // otherwise the agent taps it, nothing happens, and they assume it is broken.
  const readOnly = rest.editable === false;

  return (
    <View className={`gap-1.5 ${className}`}>
      {label ? <Text className="mb-1 text-[15px] font-semibold text-ink">{label}</Text> : null}

      <View
        style={multiline ? { minHeight } : undefined}
        className={`flex-row border ${readOnly ? 'bg-card-muted' : 'bg-card'} ${
          multiline ? 'rounded-2xl px-4 py-3' : 'h-[52px] items-center rounded-full px-5'
        } ${error ? 'border-danger' : 'border-line'}`}>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.inkSoft}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          className="flex-1 text-base text-ink"
          {...rest}
        />
        {right}
      </View>

      {error ? <Text className="px-2 text-xs text-danger">{error}</Text> : null}
      {!error && hint ? <Text className="text-xs text-ink-muted">{hint}</Text> : null}
    </View>
  );
});
