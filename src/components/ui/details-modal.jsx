import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme/theme-provider';

/**
 * THE "show me everything about this record" sheet.
 *
 * A list card shows the few fields worth scanning; this shows the rest, so the
 * agent never has to take the card's summary on trust. `rows` is
 * [{ key, label, value, tone }] — a string or a node, like `ui/detail-rows` —
 * and anything null/undefined is dropped by the caller, not padded with dashes.
 *
 * `tone` ('success' | 'warning' | 'danger' | 'muted') colours a STRING value
 * from the palette. That is the point of it: a Modal is its own host tree, so
 * a caller cannot just pass a class-coloured node in here and expect it to
 * render — the tone travels as data and the colour is resolved in here.
 *
 * Read-only by design: it has one button, and it closes. Anything that ACTS on
 * what it shows belongs on a screen, not in here.
 *
 * Styled from `colors`, not classes: a Modal renders into its own host tree,
 * which the theme's CSS variables do not reach (same rule as
 * `ui/success-modal` and `ui/confirm-dialog`).
 */
const TONES = {
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  muted: 'inkMuted',
};

export function DetailsModal({ visible, title, subtitle, rows = [], onClose, closeLabel }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const shown = rows.filter((row) => row && row.value !== null && row.value !== undefined);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: '#00000066',
          justifyContent: 'flex-end',
        }}>
        {/* Swallows the tap so pressing the card itself does not close it. */}
        <Pressable
          onPress={() => {}}
          style={{
            maxHeight: '86%',
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 28,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.ink }}>{title}</Text>
              {subtitle ? (
                <Text style={{ marginTop: 4, fontSize: 13, color: colors.inkMuted }}>
                  {subtitle}
                </Text>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={closeLabel ?? t('common.close')}
              hitSlop={12}
              onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.inkMuted} />
            </Pressable>
          </View>

          <ScrollView style={{ marginTop: 16 }} showsVerticalScrollIndicator={false}>
            {shown.map((row, index) => (
              <View
                key={row.key ?? row.label}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  paddingVertical: 13,
                  borderBottomWidth: index < shown.length - 1 ? 1 : 0,
                  borderBottomColor: colors.line,
                }}>
                <Text style={{ fontSize: 14, color: colors.inkMuted, flexShrink: 1 }}>
                  {row.label}
                </Text>

                {typeof row.value === 'string' || typeof row.value === 'number' ? (
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: row.tone ? '600' : '500',
                      color: colors[TONES[row.tone]] ?? colors.ink,
                      flexShrink: 1,
                      textAlign: 'right',
                    }}>
                    {row.value}
                  </Text>
                ) : (
                  row.value
                )}
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
