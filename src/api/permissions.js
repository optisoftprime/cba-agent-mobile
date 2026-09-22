import { api, send } from '@/api/client';
import { endpoints } from '@/api/endpoints';

/**
 * What this agent is allowed to do — GET /api/v1/agent/profile/permissions.
 *
 * Resolves with `[{ code, label }]`, the permissions granted to them in finman
 * by their administrator. Only GRANTED permissions are listed: a code that is
 * absent is a code they do not have.
 *
 * The app asks up front so a button can explain itself on tap instead of
 * firing a call that fails. The server refuses a forbidden action anyway —
 * this is about the agent finding out BEFORE they have filled in a form and
 * counted out cash, not about trusting the client.
 */

/**
 * Every code the server currently issues, verified against the live endpoint.
 * Referenced by name so a typo is a build error rather than a permission that
 * silently never matches.
 *
 * Only gate a feature on a code the server actually ENFORCES. Per the backend's
 * integration guide:
 *   - DEPOSIT, AJO (and WITHDRAWAL, no screen yet) are enforced — gate on them.
 *   - Reading the customers and accounts the agent manages, end of day,
 *     remittance, dashboard, profile and notifications are BASELINE — every
 *     agent has them whatever is ticked, so they are never gated.
 *   - CUSTOMER_MANAGEMENT, LOAN_COLLECTION, SUPPORT_TICKETS and ACCOUNT_OPENING
 *     are stored but grant nothing yet. Gating on them would lock an agent out
 *     of something the server lets them do. Gate on them only once the backend
 *     starts enforcing them.
 */
export const Permission = {
  accountOpening: 'ACCOUNT_OPENING',
  ajo: 'AJO',
  customerManagement: 'CUSTOMER_MANAGEMENT',
  deposit: 'DEPOSIT',
  loanCollection: 'LOAN_COLLECTION',
  supportTickets: 'SUPPORT_TICKETS',
  withdrawal: 'WITHDRAWAL',
};

/** The one key, so anything can invalidate it without importing the query. */
export const PERMISSIONS_KEY = ['permissions'];

export const permissionsQuery = {
  queryKey: PERMISSIONS_KEY,
  queryFn: () => send(api.get(endpoints.agent.permissions)),
  // No staleTime. An administrator can revoke a permission mid-shift, and the
  // agent should not keep a button that stopped working minutes ago. Refreshes
  // are driven explicitly — pull-to-refresh, returning to the foreground, and
  // the server refusing a call — so this costs one small request at those
  // moments rather than on every render.
  staleTime: 0,
};
