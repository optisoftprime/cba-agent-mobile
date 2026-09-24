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
  return varianceLabel(t, variance);
}

/**
 * The string form, for a caller that already has `t` and cannot call a hook —
 * a row built inside a `.map()`, say. A Modal's own subtree is the usual
 * reason: colour classes are not safe in there, so the wording goes in as text
 * and the colour comes from a tone.
 */
export function varianceLabel(t, variance) {
  const { kind, amount } = describeVariance(variance);
  if (kind === 'unknown') return t('eod.variance.unknown');
  if (kind === 'balanced') return t('eod.variance.balanced');
  return t(`eod.variance.${kind}`, { amount: formatCurrencyPrecise(amount) });
}

/** How a variance is coloured where classes do not reach — see `ui/details-modal`. */
export const VARIANCE_TONE = {
  unknown: 'muted',
  balanced: 'success',
  over: 'warning',
  short: 'danger',
};
