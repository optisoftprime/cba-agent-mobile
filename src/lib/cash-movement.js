/**
 * Shared rules for any call that moves cash — deposits and remittances today.
 *
 * Both endpoints take a `clientReference` and answer with the same
 * cash-movement shape:
 *
 *   { uuid, transactionId, accountNumber, amount, status, customerBalanceAfter,
 *     cashInHand, businessDate, capturedAt, pendingReason, duplicate }
 *
 * so the idempotency key and the "did the money land?" test live here, once,
 * rather than being copied into each feature.
 */

/**
 * An idempotency key for ONE attempt. The server answers `duplicate: true` to a
 * reference it has already posted instead of moving the money twice — so a
 * screen generates this once, when it mounts, and reuses it on every retry.
 * A fresh reference per tap turns a retry after a timeout into a second
 * movement of the same cash.
 *
 * Random rather than derived from the amount: two genuine movements of the
 * same amount minutes apart are legitimate and must not collide.
 */
export function newClientReference() {
  const random = Math.random().toString(36).slice(2, 10);
  return `cba-${Date.now()}-${random}`;
}

/**
 * `Posted` means the money moved. `Pending` means it is over the agent's cap
 * and waiting on approval — it has NOT moved, and a screen must not say it has.
 */
export function isPosted(result) {
  return String(result?.status ?? '').toUpperCase() === 'POSTED';
}
