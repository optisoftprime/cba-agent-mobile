import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';

import { formatDate, fromIsoDate, toIsoDate } from '@/lib/format';
import { useTheme } from '@/theme/theme-provider';

/**
 * A labelled date field, shaped exactly like `ui/select-field` so a form mixing
 * the two looks like one form. Tapping it opens the platform's own date picker.
 *
 * `value` and `onChange` speak `YYYY-MM-DD` — a plain date, which is what this
 * backend's date fields are. A Date object is deliberately NOT exposed: the
 * moment a timezone gets involved, "today" can be sent as yesterday.
 *
 * The two platforms disagree about what a date picker is, so this follows each:
 * Android opens its own modal dialog and fires once, while iOS renders inline
 * and needs somewhere to live plus a Done button, so it gets a sheet.
 */

export function DateField({
  label,
  placeholder,
  value,
  onChange,
  error,
  minimumDate,
  maximumDate,
  doneLabel,
  className = '',
}) {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  // iOS edits a draft until Done; Android commits on the dialog's own OK.
  const [draft, setDraft] = useState(() => fromIsoDate(value));

  const openPicker = () => {
    setDraft(fromIsoDate(value));
    setOpen(true);
  };

  const onAndroidChange = (event, date) => {
    setOpen(false);
    if (event.type === 'set' && date) onChange?.(toIsoDate(date));
  };

  return (
    <View className={`gap-1.5 ${className}`}>
      {label ? <Text className="mb-1 text-[15px] font-semibold text-ink">{label}</Text> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={openPicker}
        className={`h-[52px] flex-row items-center justify-between rounded-full border bg-card px-5 active:bg-card-muted ${
          error ? 'border-danger' : 'border-line'
        }`}>
        <Text className={`flex-1 text-base ${value ? 'text-ink' : 'text-ink-soft'}`}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={colors.inkSoft} />
      </Pressable>

      {error ? <Text className="px-2 text-xs text-danger">{error}</Text> : null}

      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={draft}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={onAndroidChange}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal
          visible={open}
          transparent
          animationType="fade"
          onRequestClose={() => setOpen(false)}>
          {/* Styled from `colors`, not classes — a Modal renders into its own
              host tree, which the theme's CSS variables do not reach. */}
          <Pressable
            onPress={() => setOpen(false)}
            style={{ flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' }}>
            <Pressable
              onPress={() => {}}
              style={{
                backgroundColor: colors.card,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingHorizontal: 16,
                paddingTop: 8,
                paddingBottom: 24,
              }}>
              <DateTimePicker
                value={draft}
                mode="date"
                display="spinner"
                // iOS's picker paints its own chrome; without this it can come
                // up light-on-light when the app is in dark mode.
                themeVariant={isDark ? 'dark' : 'light'}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                onChange={(event, date) => date && setDraft(date)}
              />

              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setOpen(false);
                  onChange?.(toIsoDate(draft));
                }}
                style={{
                  height: 50,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.primary,
                }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.onPrimary }}>
                  {doneLabel}
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}
