import { api, send } from '@/api/client';
import { endpoints } from '@/api/endpoints';

/**
 * Agent home — GET /api/v1/agent/dashboard.
 *
 * Resolves with the response's `data`:
 *   agentCode, fullName, branchName, businessDate,
 *   customerCount, accountCount, activeLoans, transactionsToday,
 *   collectedToday, pendingToday, collectionsTotal,
 *   cashInHand, availableCash, awaitingRemittance,
 *   remittedToday, remittedTotal, remittedPending,
 *   reconciliationHold, holdReason, unreadNotifications,
 *   todaysTasks[]    { loanCode, customerName, amount, dueDate, dueStatus }
 *   recentActivity[] { transactionId, customerName, accountNumber, amount,
 *                      narration, status, capturedAt }
 *
 * Cash figures (backend guide, 2026-10-20):
 * - `cashInHand`  — ledger figure; still includes a remittance awaiting approval.
 * - `availableCash` — cashInHand minus cash handed over but not yet approved; the
 *   limit a remittance/withdrawal is checked against. The MAIN home figure.
 * - `awaitingRemittance` — total remitted and still awaiting branch approval, any
 *   day. Shown only when > 0.
 * `cashInHand`/`availableCash` are null for an agent with no till. `availableCash`
 * and `awaitingRemittance` are newer: this gateway does not return them yet, so
 * the home screen falls back to cashInHand until it does (see src/app/(tabs)).
 */
export function fetchDashboard() {
  return send(api.get(endpoints.dashboard.summary));
}

/** Spread into useQuery so the key is defined once, next to the call. */
export const dashboardQuery = {
  queryKey: ['dashboard'],
  queryFn: fetchDashboard,
};
