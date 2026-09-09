import { brand } from '@/theme/brand';

const { symbol, locale } = brand.currency;

/** ₦42,850 — full amount with thousand separators, in the brand's currency. */
export function formatCurrency(amount) {
  return `${symbol}${Number(amount).toLocaleString(locale, { maximumFractionDigits: 2 })}`;
}

/**
 * ₦50,000.00 — always two decimals. For amounts being posted, confirmed or
 * receipted, where a bare "₦50,000" reads as an estimate.
 */
export function formatCurrencyPrecise(amount) {
  return `${symbol}${Number(amount).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** 0123456789 → ****6789, for receipts and anywhere a full number isn't needed. */
export function maskAccount(number, visible = 4) {
  const value = String(number ?? '');
  if (value.length <= visible) return value;
  return `****${value.slice(-visible)}`;
}

/** ₦4.5M — compact, for summary tiles where space is tight. */
export function formatCurrencyCompact(amount) {
  const value = Number(amount);
  if (Math.abs(value) >= 1_000_000_000) return `${symbol}${trim(value / 1_000_000_000)}B`;
  if (Math.abs(value) >= 1_000_000) return `${symbol}${trim(value / 1_000_000)}M`;
  if (Math.abs(value) >= 1_000) return `${symbol}${trim(value / 1_000)}K`;
  return formatCurrency(value);
}

function trim(value) {
  // 4.5 stays 4.5, 4.0 becomes 4 — matches how the designs read.
  return value.toFixed(1).replace(/\.0$/, '');
}

/**
 * Which greeting applies right now. Returns a translation key suffix so the
 * wording lives in the locale files: t(`dashboard.greeting.${greetingKey()}`).
 */
export function greetingKey(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
