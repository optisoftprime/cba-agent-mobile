import { firstNameOf } from '@/lib/format';

/**
 * The session, in the shape the agent-facing screens render.
 *
 * Login and GET /agent/profile disagree on names (`phoneNumber` vs `phone`,
 * `branchName` vs `branch`) and `role` only arrives with the profile. Mapping
 * that once here keeps the screens free of it.
 */

/** Statuses the locale files have wording for. */
const KNOWN_STATUSES = ['active', 'inactive', 'suspended'];

export function agentView(user) {
  if (!user) return null;

  const rawStatus = String(user.status ?? '').toLowerCase();

  return {
    name: user.fullName ?? '',
    firstName: firstNameOf(user.fullName) ?? '',
    code: user.agentCode ?? '',
    role: user.role ?? '',
    phone: user.phoneNumber ?? '',
    email: user.email ?? '',
    branch: user.branchName ?? '',
    operatingArea: user.operatingArea ?? '',
    /**
     * Set only when the locale files can translate it. The server may send a
     * status we have no wording for, and showing `profile.status.WHATEVER` on
     * screen is worse than showing the server's own word — see `statusLabel`.
     */
    statusKey: KNOWN_STATUSES.includes(rawStatus) ? rawStatus : null,
    statusLabel: user.status ?? '',
  };
}

/** "AG-00125 · Field Agent", skipping whichever half is missing. */
export function agentSubtitle(agent) {
  return [agent?.code, agent?.role].filter(Boolean).join(' \u00b7 ');
}
