import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/**
 * THE success modal. Every completed operation ends here — a deposit posted, a
 * ticket raised, a device activated — not in a toast.
 *
 * A toast is for something the agent may glance at and ignore; it slides away
 * on a timer and takes the reference number with it. Finishing an operation
 * that moved money or created a record is not that: the agent has to SEE it
 * landed, read back what the server returned, and acknowledge it. So this
 * blocks, it does not time out, and the backdrop does nothing by default —
 * leaving is a deliberate tap.
 *
 * Props:
 *   visible
 *   icon            Ionicons name inside the disc (default a tick)
 *   title           what happened ("Deposit posted")
 *   message         one line of context, optional
 *   details         [{ key, label, value }] — what the server returned
 *                   (reference, new balance). Rendered as rows, optional.
 *   primaryLabel    the acknowledging action (required)
 *   onPrimary
 *   secondaryLabel  optional second action ("View receipt")
 *   onSecondary
 *   tone            'success' (default) or 'pending' — a deposit over the cap
 *                   comes back Pending, which is a finished operation but NOT
 *                   a completed one, and must not show a green tick.
 *
 * Styled from `colors`, not classes: a Modal renders into its own host tree, so
 * the theme's CSS variables do not reach inside one (same rule as
 * `ui/confirm-dialog` and `ui/select-field`).
 */
const TONES = {
  success: { disc: 'successSoft', mark: 'success', icon: 'checkmark-sharp' },
  pending: { disc: 'warningSoft', mark: 'warning', icon: 'time-outline' },
};

export function SuccessModal({
  visible,
  icon,
  title,
  message,
  details = [],
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  tone = 'success',
}) {
  const { colors } = useTheme();
  const shape = TONES[tone] ?? TONES.success;
  const rows = details.filter((row) => row && row.value !== null && row.value !== undefined);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // Android's hardware back does what the primary button does, rather than
      // silently dismissing a result the agent has not read.
      onRequestClose={onPrimary}>
      <View
        style={{
          flex: 1,
          backgroundColor: '#00000066',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 28,
        }}>
        <View
          style={{
            width: '100%',
            maxHeight: '86%',
            backgroundColor: colors.card,
            borderRadius: 24,
            paddingHorizontal: 24,
            paddingTop: 30,
            paddingBottom: 24,
          }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center' }}>
            <View
              style={{
                height: 92,
                width: 92,
                borderRadius: 46,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors[shape.disc],
              }}>
              <Ionicons name={icon ?? shape.icon} size={46} color={colors[shape.mark]} />
            </View>

            <Text
              style={{
                marginTop: 20,
                fontSize: 19,
                fontWeight: '700',
                color: colors.ink,
                textAlign: 'center',
              }}>
              {title}
            </Text>

            {message ? (
              <Text
                style={{
                  marginTop: 10,
                  fontSize: 14,
                  lineHeight: 21,
                  color: colors.inkMuted,
                  textAlign: 'center',
                }}>
                {message}
              </Text>
            ) : null}

            {rows.length ? (
              <View
                style={{
                  marginTop: 22,
                  width: '100%',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.line,
                  backgroundColor: colors.background,
                  paddingHorizontal: 16,
                }}>
                {rows.map((row, index) => (
                  <View
                    key={row.key ?? row.label}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      paddingVertical: 13,
                      borderBottomWidth: index < rows.length - 1 ? 1 : 0,
                      borderBottomColor: colors.line,
                    }}>
                    <Text style={{ fontSize: 13, color: colors.inkMuted }}>{row.label}</Text>
                    <Text
                      // Long references wrap rather than pushing the label off.
                      style={{
                        flexShrink: 1,
                        fontSize: 14,
                        fontWeight: '600',
                        color: colors.ink,
                        textAlign: 'right',
                      }}>
                      {row.value}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            onPress={onPrimary}
            style={{
              marginTop: 24,
              height: 50,
              width: '100%',
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary,
            }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.onPrimary }}>
              {primaryLabel}
            </Text>
          </Pressable>

          {secondaryLabel ? (
            <Pressable
              accessibilityRole="button"
              onPress={onSecondary}
              style={{
                marginTop: 12,
                height: 50,
                width: '100%',
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.cardMuted,
              }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }}>
                {secondaryLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
