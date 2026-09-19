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

/**
 * Sign out server-side. The token is REVOKED and cannot be used again, so the
 * local session must be cleared whether or not this succeeds — see the auth
 * provider. Best effort: an agent who is offline still gets to sign out of
 * their own handset.
 */
export function logout() {
  return send(api.post(endpoints.agent.logout));
}

/**
 * Change the password of the agent who is already signed in.
 *
 * `confirmNewPassword` is sent as well as `newPassword` — the server requires
 * both and checks they match, so the screen sends what the agent typed in each
 * box rather than sending one value twice. If the two ever disagree, that is a
 * real mismatch the agent should be told about, not one the app papers over.
 *
 * NOTE: passwords are excluded from the interceptor's whitespace trimming
 * (see src/api/client.js) — a space can be part of a real password.
 */
export function changePassword({ oldPassword, newPassword, confirmNewPassword }) {
  return send(
    api.post(endpoints.agent.changePassword, { oldPassword, newPassword, confirmNewPassword }),
  );
}

/**
 * Forgotten password, step 1 — sends an OTP to the account's email.
 *
 * On publicApi: nobody is signed in. The screen shows the SAME message
 * whatever comes back, so the form cannot be used to discover which addresses
 * have accounts.
 */
export function requestPasswordReset({ email }) {
  return send(publicApi.post(endpoints.agent.passwordResetRequest, { email }));
}

/**
 * Step 2 — exchange the OTP for a short-lived reset token.
 * The server types `otp` as an INTEGER, so it is sent as a number, not the
 * string the keypad produced.
 */
export function verifyPasswordResetOtp({ email, otp }) {
  return send(
    publicApi.post(endpoints.agent.passwordResetVerify, { email, otp: Number(otp) }),
  );
}

/** Step 3 — set the new password using the token from step 2. */
export function confirmPasswordReset({ token, newPassword, confirmNewPassword }) {
  return send(
    publicApi.post(endpoints.agent.passwordResetConfirm, {
      token,
      newPassword,
      confirmNewPassword,
    }),
  );
}
