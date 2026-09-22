import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatCurrencyPrecise } from '@/lib/format';
import { describeVariance, VARIANCE_TEXT_CLASS } from '@/lib/variance';

/**
 * "₦500 short" / "₦200 over" / "Balanced", coloured by how much it matters.
 *
 * NOT for use inside a Modal — the theme's CSS variables do not reach a
 * Modal's host tree, so the colour class would do nothing there. Use
 * `useVarianceLabel()` for a plain string instead (see the EOD success modal).
 */
export function VarianceText({ variance, className = '' }) {
  const label = useVarianceLabel(variance);
  const { kind } = describeVariance(variance);

  return (
    <Text className={`text-[14px] font-semibold ${VARIANCE_TEXT_CLASS[kind]} ${className}`}>
      {label}
    </Text>
  );
}

/** The same wording as a plain string, for places that cannot take a node. */
export function useVarianceLabel(variance) {
  const { t } = useTranslation();
  const { kind, amount } = describeVariance(variance);
  return kind === 'balanced'
    ? t('eod.variance.balanced')
    : t(`eod.variance.${kind}`, { amount: formatCurrencyPrecise(amount) });
}
