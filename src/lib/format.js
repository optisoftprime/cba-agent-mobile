import { brand } from '@/theme/brand';

const { symbol, locale } = brand.currency;

/**
 * What a missing figure reads as. NOT ₦0.00 — the server sending nothing and
 * the agent holding nothing are different facts, and printing one as the other
 * is how a screen states something untrue.
 */
export const NO_FIGURE = '—';

/** null / undefined / '' — the server sent nothing. A real 0 is not missing. */
const isMissing = (amount) => amount === null || amount === undefined || amount === '';

/** ₦42,850 — full amount with thousand separators, in the brand's currency. */
export function formatCurrency(amount) {
  if (isMissing(amount)) return NO_FIGURE;
  const value = Number(amount);
  if (!Number.isFinite(value)) return NO_FIGURE;
  const sign = value < 0 ? '-' : '';
  return `${sign}${symbol}${Math.abs(value).toLocaleString(locale, { maximumFractionDigits: 2 })}`;
}

/**
 * ₦50,000.00 — always two decimals. For amounts being posted, confirmed or
 * receipted, where a bare "₦50,000" reads as an estimate.
 */
export function formatCurrencyPrecise(amount) {
  if (isMissing(amount)) return NO_FIGURE;
  const value = Number(amount);
  if (!Number.isFinite(value)) return NO_FIGURE;
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

/**
 * Where shortening starts. Below a million the full figure still fits the
 * tiles, and "₦4.5K" is strictly worse than "₦4,500" — same width, less
 * precise. A million is where the string starts running past the edge.
 */
export const COMPACT_FROM = 1_000_000;

/**
 * Is this figure big enough that `formatCurrencyCompact` will shorten it?
 *
 * Callers use it to decide whether the value needs a way to see the exact
 * amount: offering "tap for the full figure" on a number that is already
 * complete is noise.
 */
export function isCompactCurrency(amount) {
  if (isMissing(amount)) return false;
  const value = Number(amount);
  return Number.isFinite(value) && Math.abs(value) >= COMPACT_FROM;
}

/**
 * ₦4.32M — compact, for tiles a full figure would overflow.
 *
 * Only ever an approximation, so anywhere this is shown the exact amount has
 * to stay reachable (the dashboard makes the figure tappable). Never use it on
 * a receipt, a confirmation, or anything being posted — that is
 * `formatCurrencyPrecise`.
 */
export function formatCurrencyCompact(amount) {
  if (isMissing(amount)) return NO_FIGURE;
  const value = Number(amount);
  if (!Number.isFinite(value)) return NO_FIGURE;
  const size = Math.abs(value);
  // Sign first, as in formatCurrencyPrecise.
  const sign = value < 0 ? '-' : '';
  if (size >= 1_000_000_000_000) return `${sign}${symbol}${trim(size / 1_000_000_000_000)}T`;
  if (size >= 1_000_000_000) return `${sign}${symbol}${trim(size / 1_000_000_000)}B`;
  if (size >= COMPACT_FROM) return `${sign}${symbol}${trim(size / COMPACT_FROM)}M`;
  return formatCurrency(value);
}

function trim(value) {
  // Always two decimals: 2.45M, 4.50M, 4.00M. One decimal would round
  // ₦2,454,000 to "₦2.5M", and keeping the width identical across tiles stops
  // the figures jittering as they refresh.
  return value.toFixed(2);
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
