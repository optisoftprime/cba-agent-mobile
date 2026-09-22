import { api, send } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { nextPageOf, PAGE_SIZE } from '@/api/pagination';

/**
 * End of day — /api/v1/agent/eod/*.
 *
 * At the close of a shift the agent counts the cash they are physically
 * holding and submits it. finman compares it with what it expects them to hold:
 *
 *   expectedCash = settledCash + pendingIn − pendingOut
 *   variance     = countedCash − expectedCash
 *
 * `Balanced` closes the day and lifts a reconciliation hold. `Variance` means
 * the count does not match; the day stays open for an administrator to
 * resolve (`resolvedBy`, `resolutionNote`).
 *
 * Every call here is bound to the registered handset (`X-Agent-Device-Id`,
 * added by the client interceptor) — another phone gets a 403.
 *
 * One record shape throughout:
 *   { uuid, agentCode, businessDate, settledCash, pendingIn, pendingOut,
 *     expectedCash, countedCash, variance, status, submittedAt, submittedBy,
 *     resolvedBy, resolutionNote }
 */

/** Statuses the server documents. Compared case-insensitively — see `eodState`. */
export const EodStatus = {
  open: 'OPEN',
  balanced: 'BALANCED',
  variance: 'VARIANCE',
  resolved: 'RESOLVED',
};

/** The key every EOD query sits under, so one invalidation refreshes them all. */
export const EOD_KEY = ['eod'];

export const eodCurrentQuery = {
  queryKey: [...EOD_KEY, 'current'],
  queryFn: () => send(api.get(endpoints.eod.current)),
};

/** Past days as an infinite list. Note the items live under `items`. */
export const eodHistoryQuery = {
  queryKey: [...EOD_KEY, 'history'],
  queryFn: ({ pageParam = 0 }) =>
    send(api.get(endpoints.eod.history, { params: { page: pageParam, size: PAGE_SIZE } })),
  initialPageParam: 0,
  getNextPageParam: nextPageOf,
};

/** Submit the cash counted. `countedCash` may be 0 — holding nothing is valid. */
export function submitEod({ countedCash }) {
  // A refusal must not sign the agent out — see confirmSession in client.js.
  return send(api.post(endpoints.eod.submit, { countedCash }, { confirmSession: true }));
}

/**
 * What a record means for the screen, in one place so the EOD screen, the
 * history list and anything else read it the same way.
 *
 *   closed      — Balanced, or a variance a supervisor has Resolved: nothing
 *                 left to do today
 *   variance    — submitted, but the count did not match
 *   open        — not submitted yet
 */
export function eodState(record) {
  const status = String(record?.status ?? '').toUpperCase();
  if (status === EodStatus.balanced || status === EodStatus.resolved) return 'closed';
  if (status === EodStatus.variance) return 'variance';
  return 'open';
}
