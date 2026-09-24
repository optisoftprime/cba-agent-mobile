import { brand } from '@/theme/brand';

const { symbol, locale } = brand.currency;

/** ₦42,850 — full amount with thousand separators, in the brand's currency. */
export function formatCurrency(amount) {
  const value = Number(amount);
  const sign = value < 0 ? '-' : '';
  return `${sign}${symbol}${Math.abs(value).toLocaleString(locale, { maximumFractionDigits: 2 })}`;
}

/**
 * ₦50,000.00 — always two decimals. For amounts being posted, confirmed or
 * receipted, where a bare "₦50,000" reads as an estimate.
 */
export function formatCurrencyPrecise(amount) {
  const value = Number(amount);
  // The sign leads: cash in hand can go negative (the till has gone positive,
  // which is an invalid state the agent has to SEE), and "₦-6,000" reads as a
  // typo where "-₦6,000" reads as a figure.
  const sign = value < 0 ? '-' : '';
  return `${sign}${symbol}${Math.abs(value).toLocaleString(locale, {
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
  const size = Math.abs(value);
  // Sign first, as in formatCurrencyPrecise.
  const sign = value < 0 ? '-' : '';
  if (size >= 1_000_000_000) return `${sign}${symbol}${trim(size / 1_000_000_000)}B`;
  if (size >= 1_000_000) return `${sign}${symbol}${trim(size / 1_000_000)}M`;
  if (size >= 1_000) return `${sign}${symbol}${trim(size / 1_000)}K`;
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

/** "Adebayo Musa" → "Adebayo". Used for greetings. */
export function firstNameOf(fullName) {
  const first = String(fullName ?? '').trim().split(/\s+/)[0];
  return first || null;
}

// ── Dates ───────────────────────────────────────────────────────────────────
// Formatted by hand rather than with toLocaleDateString: Hermes ships a cut-down
// Intl, and a missing implementation there degrades to something unreadable
// instead of throwing. The same reason plural suffixes are banned (see AGENTS.md).

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parse(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * A plain date as the backend wants it: `YYYY-MM-DD`, in LOCAL time.
 *
 * Deliberately not `toISOString().slice(0, 10)` — that converts to UTC first,
 * so west of Greenwich in the evening "today" is sent as tomorrow, and east of
 * it in the morning as yesterday. A start date being a day out is the kind of
 * bug nobody reports until a plan matures on the wrong day.
 */
export function toIsoDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** `YYYY-MM-DD` -> a Date at LOCAL midnight. Falls back to today. */
export function fromIsoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''));
  if (!match) return new Date();
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** Today as `YYYY-MM-DD`. */
export function todayIso() {
  return toIsoDate(new Date());
}

/** "2026-02-20" -> "20 Feb 2026". Returns the input unchanged if unparseable. */
export function formatDate(value) {
  const date = parse(value);
  if (!date) return value ?? '';
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** ISO timestamp -> "15 Sep 2026, 3:47 PM". */
export function formatDateTime(value) {
  const date = parse(value);
  if (!date) return value ?? '';

  const hours = date.getHours();
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${formatDate(date)}, ${hour12}:${minutes} ${suffix}`;
}
