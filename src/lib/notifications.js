/**
 * How a notification is shown, and where tapping it goes.
 *
 * CAUTION: this agent's inbox is empty on the live server, so the actual
 * `type` and `targetType` values the backend sends have NOT been seen. Both
 * lookups are therefore keyword-based with a safe fallback rather than a strict
 * enum: an unrecognised type still gets a sensible bell, and an unrecognised
 * target simply doesn't navigate. Tighten these to exact values once real
 * notifications exist.
 */

/** Longest keyword first — "loan_repayment" should read as a repayment. */
const ICON_BY_KEYWORD = [
  ['repayment', 'cash-outline'],
  ['collection', 'wallet-outline'],
  ['deposit', 'wallet-outline'],
  ['payment', 'wallet-outline'],
  ['customer', 'person-outline'],
  ['ticket', 'chatbubble-ellipses-outline'],
  ['support', 'chatbubble-ellipses-outline'],
  ['loan', 'cash-outline'],
  ['ajo', 'albums-outline'],
  ['reconcil', 'alert-circle-outline'],
  ['alert', 'alert-circle-outline'],
  ['announce', 'megaphone-outline'],
  ['system', 'megaphone-outline'],
];

/** An Ionicons name for a notification type. Always returns something. */
export function notificationIcon(type) {
  const value = String(type ?? '').toLowerCase();
  const match = ICON_BY_KEYWORD.find(([keyword]) => value.includes(keyword));
  return match ? match[1] : 'notifications-outline';
}

/** targetType -> the route that shows that record. */
const ROUTE_BY_KEYWORD = [
  ['customer', 'customer'],
  ['collection', 'collection'],
  ['ticket', 'ticket'],
  ['loan', 'loan'],
];

/**
 * Where tapping a notification should land, or null when the target is one the
 * app has no screen for — the notification is still marked read, it just
 * doesn't navigate. Never guess a route: a dead end is better than throwing the
 * agent onto a screen that 404s.
 */
export function notificationRoute({ targetType, targetId } = {}) {
  if (!targetId) return null;

  const value = String(targetType ?? '').toLowerCase();
  const match = ROUTE_BY_KEYWORD.find(([keyword]) => value.includes(keyword));
  if (!match) return null;

  return `/${match[1]}/${encodeURIComponent(targetId)}`;
}
