import { forwardRef } from 'react';

import { TextField } from '@/components/ui/text-field';

/**
 * THE money input. Every field where an agent types an amount uses this, so a
 * figure is never read back as a bare run of digits.
 *
 * `2000000` and `200000` are one glance apart and ten times different. Grouping
 * as it is typed — 2,000,000 — is the difference between an agent spotting a
 * mistyped zero and posting it. This is a cash app; that mistake is expensive.
 *
 * The VALUE stays a plain numeric string ("2000.50"): only the display carries
 * separators, so callers do `Number(value)` exactly as before and nothing has
 * to strip commas before sending.
 *
 * Kobo are allowed (two decimals) because the server's floor is 0.01.
 */

const MAX_DECIMALS = 2;

/** Everything that is not a digit or a decimal point, and any extra points. */
function sanitise(input) {
  const cleaned = String(input ?? '').replace(/[^0-9.]/g, '');

  const [whole, ...rest] = cleaned.split('.');
  if (!rest.length) return whole;

  // Join the tail so "1.2.3" becomes "1.23" rather than being rejected.
  return `${whole}.${rest.join('').slice(0, MAX_DECIMALS)}`;
}

/** "2000.5" -> "2,000.5". Keeps a trailing point so ". " can still be typed. */
export function groupDigits(raw) {
  const value = String(raw ?? '');
  if (!value) return '';

  const [whole, decimals] = value.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (decimals === undefined) return grouped;
  return `${grouped}.${decimals}`;
}

export const AmountField = forwardRef(function AmountField(
  { value, onChangeText, ...props },
  ref,
) {
  return (
    <TextField
      ref={ref}
      // decimal-pad rather than numeric: numeric offers a comma/minus on some
      // Android keyboards, which we would only have to strip again.
      keyboardType="decimal-pad"
      {...props}
      value={groupDigits(value)}
      onChangeText={(next) => onChangeText?.(sanitise(next))}
    />
  );
});
