import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

const container = {
  primary: 'bg-primary active:bg-primary-dark',
  secondary: 'bg-card-muted active:bg-line',
  outline: 'border border-line bg-card active:bg-card-muted',
  danger: 'bg-danger active:opacity-90',
  ghost: 'bg-transparent',
};

const labelStyle = {
  primary: 'text-on-primary',
  secondary: 'text-ink',
  outline: 'text-ink',
  danger: 'text-on-danger',
  ghost: 'text-primary',
};

const sizes = {
  sm: { box: 'h-10 px-4', text: 'text-sm' },
  md: { box: 'h-12 px-5', text: 'text-base' },
  lg: { box: 'h-14 px-6', text: 'text-base' },
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  icon = null,
  loading = false,
  disabled,
  className = '',
  ...rest
}) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const { box, text } = sizes[size] ?? sizes.md;

  // Icons and spinners take a real colour, so they come from the palette
  // rather than a hex — same rule as everywhere else.
  const contentColor = {
    primary: colors.onPrimary,
    secondary: colors.ink,
    outline: colors.ink,
    danger: colors.onDanger,
    ghost: colors.primary,
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(isDisabled) }}
      disabled={isDisabled}
      className={`flex-row items-center justify-center gap-2 rounded-full ${box} ${
        container[variant]
      } ${isDisabled ? 'opacity-50' : ''} ${className}`}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={contentColor} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={contentColor} /> : null}
          <Text className={`font-semibold ${text} ${labelStyle[variant]}`}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
