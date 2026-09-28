import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/**
 * A compact red "PND" chip for an account that is blocked from debits.
 *
 * Just the flag on the card — a red padlock and the letters PND — so a
 * restricted account is obvious at a glance. What PND means and why this
 * account has it is spelled out in the account popup (tap the card), so the
 * chip stays small and the explanation lives where there is room for it.
 *
 * Renders nothing when the account is not restricted.
 */
export function PndBadge({ account }) {
  const { colors } = useTheme();

  if (String(account?.pndStatus ?? '').toLowerCase() !== 'yes') return null;

  return (
    <View className="flex-row items-center gap-1.5 self-start rounded-full bg-danger-soft px-3.5 py-1">
      <Ionicons name="lock-closed" size={13} color={colors.danger} />
      <Text className="text-[11px] font-bold tracking-wide text-danger">PND</Text>
    </View>
  );
}
