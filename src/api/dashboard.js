import { api, send } from '@/api/client';
import { endpoints } from '@/api/endpoints';

/**
 * Agent home — GET /api/v1/agent/dashboard.
 *
 * Resolves with the response's `data`:
 *   agentCode, fullName, branchName, businessDate,
 *   customerCount, accountCount, activeLoans, transactionsToday,
 *   collectedToday, pendingToday, collectionsTotal, cashInHand,
 *   reconciliationHold, holdReason, unreadNotifications,
 *   todaysTasks[]    { loanCode, customerName, amount, dueDate, dueStatus }
 *   recentActivity[] { transactionId, customerName, accountNumber, amount,
 *                      narration, status, capturedAt }
 */
export function fetchDashboard() {
  return send(api.get(endpoints.dashboard.summary));
}

/** Spread into useQuery so the key is defined once, next to the call. */
export const dashboardQuery = {
  queryKey: ['dashboard'],
  queryFn: fetchDashboard,
};
