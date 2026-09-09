import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/**
 * Option pickers. Two shapes, one sheet:
 *   SelectField - a labelled full-width field (forms)
 *   SelectPill  - a compact pill (a list's period filter)
 *
 * A plain Modal rather than a native picker: it renders identically on both
 * platforms, which is what the designs assume.
 */

/** Shared bottom sheet of options. */
function OptionSheet({ visible, options, value, onSelect, onClose }) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Styled from `colors` rather than classes - a Modal renders into its own
          host tree, so relying on the theme's CSS variables here is not safe. */}
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingVertical: 8,
          }}>
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => onSelect(option.value)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                }}>
                <Text
                  style={{
                    fontSize: 16,
                    color: isSelected ? colors.primary : colors.ink,
                    fontWeight: isSelected ? '600' : '400',
                  }}>
                  {option.label}
                </Text>
                {isSelected ? <Ionicons name="checkmark" size={20} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Pressable>
    </Modal>
  );
}

export function SelectField({
  label,
  placeholder,
  value,
  options,
  onChange,
  error,
  className = '',
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value);

  return (
    <View className={`gap-1.5 ${className}`}>
      {label ? <Text className="mb-1 text-[15px] font-semibold text-ink">{label}</Text> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        className={`h-[52px] flex-row items-center justify-between rounded-full border bg-card px-5 active:bg-card-muted ${
          error ? 'border-danger' : 'border-line'
        }`}>
        <Text className={`flex-1 text-base ${selected ? 'text-ink' : 'text-ink-soft'}`}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.inkSoft} />
      </Pressable>

      {error ? <Text className="px-2 text-xs text-danger">{error}</Text> : null}

      <OptionSheet
        visible={open}
        options={options}
        value={value}
        onSelect={(next) => {
          onChange?.(next);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}

/** Compact tinted pill - "Today" with a chevron, beside a section heading. */
export function SelectPill({ value, options, onChange, accessibilityLabel }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={() => setOpen(true)}
        className="h-8 flex-row items-center gap-1.5 rounded-full bg-primary-light px-4">
        <Text className="text-[13px] font-medium text-primary-dark">{selected?.label}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.primaryDark} />
      </Pressable>

      <OptionSheet
        visible={open}
        options={options}
        value={value}
        onSelect={(next) => {
          onChange?.(next);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
