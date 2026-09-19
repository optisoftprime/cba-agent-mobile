import { api, send } from '@/api/client';
import { endpoints } from '@/api/endpoints';

/**
 * Agent Deposits — POST /api/v1/agent/deposits.
 *
 * The one call in the app that moves a customer's money, so it is the one that
 * has to be hardest to get wrong:
 *
 * - **`clientReference` is the idempotency key.** The server answers
 *   `duplicate: true` when it recognises one it has already posted, rather than
 *   taking the money twice. It must therefore be generated ONCE for an attempt
 *   and reused on every retry — a fresh reference per tap turns a retry into a
 *   second deposit. `newClientReference()` is called when the review screen
 *   mounts, not when the button is pressed.
 *
 * - **`X-Agent-Device-Id` is required**, and is added to every authenticated
 *   request by the client interceptor (see src/api/client.js). Core banking
 *   compares it to the handset registered at activation.
 *
 * - **`status` is not a formality.** `Posted` means the money is in and
 *   `customerBalanceAfter` is the new balance. `Pending` means the amount is
 *   over the agent's cap and it is waiting on approval — the money has NOT
 *   landed, `pendingReason` says why, and the screen must not claim success.
 */

/**
 * An idempotency key for one deposit attempt. Random, not derived from the
 * amount or account: two genuine deposits of the same amount to the same
 * account minutes apart are legitimate and must not collide.
 */
export function newClientReference() {
  const random = Math.random().toString(36).slice(2, 10);
  return `cba-${Date.now()}-${random}`;
}

/**
 * Post a deposit. Resolves with:
 * { uuid, transactionId, accountNumber, amount, status, customerBalanceAfter,
 *   cashInHand, businessDate, capturedAt, pendingReason, duplicate }
 *
 * `latitude`/`longitude` are optional; they are omitted rather than sent as
 * nulls when the agent hasn't granted location.
 */
export function postDeposit({
  accountNumber,
  amount,
  clientReference,
  narration,
  latitude,
  longitude,
}) {
  return send(
    api.post(endpoints.deposits.create, {
      accountNumber,
      amount,
      clientReference,
      narration: narration || undefined,
      latitude: Number.isFinite(latitude) ? latitude : undefined,
      longitude: Number.isFinite(longitude) ? longitude : undefined,
    }),
  );
}

/** True when the server took the money; false when it is awaiting approval. */
export function isPosted(result) {
  return String(result?.status ?? '').toUpperCase() === 'POSTED';
}
