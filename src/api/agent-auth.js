import { api, publicApi, send } from '@/api/client';
import { endpoints } from '@/api/endpoints';

/**
 * Agent sign-in and profile — ezone-agent-service.
 */

/**
 * Sign in. Resolves with, verbatim from the server:
 *
 *   { accessToken, refreshToken, tokenType, expiresIn, agentCode, fullName,
 *     email, phoneNumber, branchName, operatingArea, status, deviceStatus,
 *     deviceActivationRequired }
 *
 * Uses publicApi: there is no session yet, and a 401 here means "wrong
 * password", which must never be treated as an expired session.
 */
export function login({ email, password }) {
  return send(publicApi.post(endpoints.agent.login, { email, password }));
}

/**
 * The signed-in agent's profile:
 *
 *   { agentCode, fullName, email, phone, branch, operatingArea, role, status }
 *
 * Note the field names differ from login's (`phone` vs `phoneNumber`, `branch`
 * vs `branchName`) — src/lib/session.js maps them onto one shape.
 *
 * Uses api, so it carries the token. That is also what makes it the token
 * check on startup: a 401 here means the stored token is no longer good.
 */
export function fetchAgentProfile({ silent = false } = {}) {
  // `silent` is for the startup check, which tests the stored token on
  // purpose. A 401 there is an expected outcome, not an interruption, so it
  // must not raise the app-wide "session expired" toast.
  return send(api.get(endpoints.agent.profile, { skipSessionExpiry: silent }));
}
