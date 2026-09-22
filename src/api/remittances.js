import { api, send } from '@/api/client';
import { endpoints } from '@/api/endpoints';

/**
 * Agent remittances — POST /api/v1/agent/remittances.
 *
 * Hands cash the agent is holding back to the branch, reducing their cash in
 * hand (and so what end of day expects them to count).
 *
 * Same rules as a deposit, because it is the same kind of call:
 * - `clientReference` is the idempotency key — generate it once per attempt
 *   with `newClientReference()` from `@/lib/cash-movement`, reuse it on retry.
 * - The response is a cash movement; check it with `isPosted()` from the same
 *   module. `Pending` means it has NOT moved yet.
 *
 * Resolves with:
 *   { uuid, transactionId, accountNumber, amount, status, customerBalanceAfter,
 *     cashInHand, businessDate, capturedAt, pendingReason, duplicate }
 */
export function postRemittance({ amount, clientReference, narration }) {
  return send(
    api.post(
      endpoints.remittances.create,
      {
        amount,
        clientReference,
        narration: narration || undefined,
      },
      // A refusal must not sign the agent out — see confirmSession in client.js.
      { confirmSession: true },
    ),
  );
}
