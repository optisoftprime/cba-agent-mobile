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
 * **The app is the only thing enforcing these.** Verified against the live
 * service with CUSTOMER_MANAGEMENT, SUPPORT_TICKETS, DEPOSIT and AJO all
 * revoked: `/agent/customers`, `/agent/support/tickets` and the rest still
 * answered 200. The backend's integration guide says some of these codes
 * "grant nothing yet", and that is exactly why every entry point AND every
 * gated screen has to check — a revoked feature that stays reachable is a
 * feature the administrator believes they switched off.
 *
 * So: fade the control (`usePermission().lockedClass`), guard the tap
 * (`press`), and have the destination screen render `layout/locked-screen`.
 * The entry points are the courtesy; the screen check is the enforcement,
 * because a notification tap or a stale stack reaches a screen directly.
 *
 * Baseline — never gated, every agent has them: the dashboard, their profile,
 * notifications, end of day and remittance.
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

/**
 * Which permission each tab needs. A tab with none is always available.
 * Keyed by the route name expo-router gives the screen — see
 * `src/app/(tabs)/_layout.jsx`.
 */
export const TAB_PERMISSION = {
  'customers/index': Permission.customerManagement,
  'loans/index': Permission.loanCollection,
  'support/index': Permission.supportTickets,
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
