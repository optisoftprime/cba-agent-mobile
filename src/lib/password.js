import { z } from 'zod';

/**
 * The bank's password policy, in one place.
 *
 * Taken from the server's own rejection, not guessed:
 *   "Password must contain at least one upper case, lower case, symbol,
 *    number and can not be less than 6 digits"
 *
 * Checking it on the device is a courtesy, not the authority — the server
 * enforces it either way. The point is that an agent finds out while typing
 * rather than after a round trip, and that both screens that set a password
 * (change-password, and the last step of a reset) apply the SAME rule.
 *
 * Zod messages are translation KEYS here; `ControlledField` translates them.
 */

export const PASSWORD_MIN_LENGTH = 6;

/** Anything that is not a letter, a digit, or whitespace counts as a symbol. */
const SYMBOL = /[^A-Za-z0-9\s]/;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, 'auth.validation.passwordTooShort')
  .refine((value) => /[A-Z]/.test(value), 'auth.validation.passwordNeedsUpper')
  .refine((value) => /[a-z]/.test(value), 'auth.validation.passwordNeedsLower')
  .refine((value) => /[0-9]/.test(value), 'auth.validation.passwordNeedsNumber')
  .refine((value) => SYMBOL.test(value), 'auth.validation.passwordNeedsSymbol');

/**
 * A { newPassword, confirmNewPassword } pair that must match. The mismatch is
 * reported on the CONFIRM field, which is the one the agent should retype.
 */
export function newPasswordFields(extra = {}) {
  return z
    .object({ ...extra, newPassword: passwordSchema, confirmNewPassword: z.string() })
    .refine((values) => values.newPassword === values.confirmNewPassword, {
      message: 'auth.validation.passwordsDoNotMatch',
      path: ['confirmNewPassword'],
    });
}
