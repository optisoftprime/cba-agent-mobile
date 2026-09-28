import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme/theme-provider';

/**
 * Post-No-Debit notice for one account.
 *
 * The backend now says whether an account is blocked from debits and why
 * (`pndStatus`, `pndReason`), and whether the customer can lift it themselves
 * (`tierUpgradeClearsPnd`). An agent standing in front of that customer needs
 * both: that a withdrawal will be refused, and what to tell them to do about it.
 *
 * Renders nothing when the account is not restricted, so it is safe to drop
 * onto every account card.
 *
 * PND blocks DEBITS, not credits — a deposit still goes through — so this is a
 * heads-up, not a block on the agent's own deposit flow.
 */
const REASON_KEY = {
  TIER_BREACH: 'customers.detail.pnd.reasonTierBreach',
  MANUAL: 'customers.detail.pnd.reasonManual',
};

export function PndNotice({ account }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (String(account?.pndStatus ?? '').toLowerCase() !== 'yes') return null;

  const reasonKey = REASON_KEY[String(account.pndReason ?? '').toUpperCase()];
  const reason = reasonKey ? t(reasonKey) : null;
  const fix = account.tierUpgradeClearsPnd
    ? t('customers.detail.pnd.upgradeClears')
    : t('customers.detail.pnd.branchOnly');

  return (
    <View className="mt-2 flex-row items-start gap-1.5 rounded-lg bg-warning-soft px-2.5 py-2">
      <Ionicons name="lock-closed" size={13} color={colors.onWarningSoft} />
      <Text className="flex-1 text-[12px] leading-4 text-on-warning-soft">
        <Text className="font-semibold">{t('customers.detail.pnd.blocked')}</Text>
        {reason ? ` — ${reason}` : ''}
        {` ${fix}`}
      </Text>
    </View>
  );
}
