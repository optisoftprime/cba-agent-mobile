import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/**
 * Centred confirmation dialog - the last check before an irreversible action.
 *
 * Styled from `colors` rather than classes: a Modal renders into its own host
 * tree, so relying on the theme's CSS variables inside one is not safe.
 */
export function ConfirmDialog({
  visible,
  icon = 'information-circle-outline',
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          backgroundColor: '#00000066',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}>
        <Pressable
          onPress={() => {}}
          style={{
            width: '100%',
            backgroundColor: colors.card,
            borderRadius: 20,
            paddingHorizontal: 24,
            paddingVertical: 28,
            alignItems: 'center',
          }}>
          <Ionicons name={icon} size={44} color={colors.primary} />

          <Text
            style={{
              marginTop: 16,
              fontSize: 17,
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
                fontSize: 13,
                lineHeight: 20,
                color: colors.inkMuted,
                textAlign: 'center',
              }}>
              {message}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={onCancel}
            style={{
              marginTop: 24,
              height: 48,
              width: '100%',
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.cardMuted,
            }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }}>{cancelLabel}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onConfirm}
            style={{
              marginTop: 12,
              height: 48,
              width: '100%',
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary,
            }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.onPrimary }}>
              {confirmLabel}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
