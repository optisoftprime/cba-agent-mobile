import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme/theme-provider';

/**
 * THE "you cannot do this" modal.
 *
 * Shown when an agent taps something their administrator has not granted them,
 * either because the app knew up front (`PermissionProvider.guard`) or because
 * the server refused the call.
 *
 * A modal rather than a toast: a toast slides away while the agent is still
 * looking at the button wondering whether they mis-tapped. This is a dead end
 * they need to read and acknowledge, and the next step — ask your
 * administrator — has to survive long enough to be understood.
 *
 * Styled from `colors`, not classes: a Modal renders into its own host tree,
 * which the theme's CSS variables do not reach.
 */
export function PermissionDeniedModal({ visible, feature, rawMessage = false, onClose }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: '#00000066',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 16,
        }}>
        <Pressable
          onPress={() => {}}
          style={{
            width: '100%',
            maxWidth: 520,
            backgroundColor: colors.card,
            borderRadius: 24,
            paddingHorizontal: 24,
            paddingTop: 30,
            paddingBottom: 24,
            alignItems: 'center',
          }}>
          <View
            style={{
              height: 84,
              width: 84,
              borderRadius: 42,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.warningSoft,
            }}>
            <Ionicons name="lock-closed-outline" size={40} color={colors.warning} />
          </View>

          <Text
            style={{
              marginTop: 20,
              fontSize: 19,
              fontWeight: '700',
              color: colors.ink,
              textAlign: 'center',
            }}>
            {t('permissions.denied.title')}
          </Text>

          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 21,
              color: colors.inkMuted,
              textAlign: 'center',
            }}>
            {/* Name the thing they tried to do when we know it — "You do not
                have permission to use Deposit" is actionable; a bare "you do
                not have permission" leaves them guessing which tap caused it. */}
            {!feature
              ? t('permissions.denied.message')
              : rawMessage
                ? feature
                : t('permissions.denied.messageNamed', { feature })}
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
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
              {t('permissions.denied.dismiss')}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
