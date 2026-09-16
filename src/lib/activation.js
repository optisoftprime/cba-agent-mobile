import { updateUser } from '@/lib/session';
import { load, remove, save, StorageKeys } from '@/lib/storage';

/**
 * Device activation — the rules and the saved progress.
 *
 * The flow is: activation code → OTP sent → OTP verified. The middle step can
 * outlive the app: the phone can die on the OTP screen. So once the code is
 * accepted, the progress is written to SecureStore and the splash screen sends
 * the agent straight back to the OTP screen on the next launch. Verifying the
 * OTP clears it, so a finished activation never resumes.
 *
 * `agentCode` is what resend and verify are keyed by — the server identifies
 * the pending activation by it. `sentTo` is the masked destination the server
 * reports (e.g. "***3924"), for display only.
 */

/** Change these if the admin-issued code or the OTP changes shape. */
export const ACTIVATION_CODE = { length: 6, type: 'numeric' };
export const OTP = { length: 6, type: 'numeric' };
export const RESEND_COOLDOWN_SECONDS = 60;

/** The one stage that can be resumed. Named so later stages can join it. */
export const ActivationStage = {
  verifyOtp: 'verify-otp',
};

/** Saved progress, or null when no activation is in flight. */
export async function getPendingActivation() {
  const pending = await load(StorageKeys.pendingActivation);
  // Without an agentCode neither resend nor verify can be called, so a record
  // missing it cannot be resumed — treat it as none.
  if (!pending?.stage || !pending?.agentCode) return null;
  return pending;
}

/**
 * Called once the activation code is accepted and the OTP has been sent.
 * `otpSentAt` drives the resend countdown, so it stays correct across a
 * restart instead of resetting to a full minute.
 */
export async function savePendingActivation({ agentCode, sentTo }) {
  // Without this the record would be written, rejected as unresumable by
  // getPendingActivation, and the OTP screen would bounce silently back to the
  // code screen — which looks like the screen refusing to advance. Fail loudly
  // instead: the agent sees an error, and the log says what was missing.
  if (!agentCode) {
    throw new Error('[activation] cannot save progress without an agentCode');
  }

  await save(StorageKeys.pendingActivation, {
    stage: ActivationStage.verifyOtp,
    agentCode,
    sentTo: sentTo ?? null,
    otpSentAt: Date.now(),
  });
}

/** Seconds until "Resend" is allowed again, from when the OTP was last sent. */
export function resendSecondsLeft(otpSentAt, now = Date.now()) {
  if (!otpSentAt) return 0;
  const remainingMs = otpSentAt + RESEND_COOLDOWN_SECONDS * 1000 - now;
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

/** Keep the destination current if the server reports a different one on resend. */
export async function updatePendingActivation(fields) {
  const current = await getPendingActivation();
  if (!current) return;
  await save(StorageKeys.pendingActivation, { ...current, ...fields });
}

/** Abandon an in-flight activation ("use a different code"). */
export async function clearPendingActivation() {
  await remove(StorageKeys.pendingActivation);
}

/**
 * OTP verified. Clear the progress FIRST, then record the outcome — if the app
 * dies between the two, the worst case is a fresh start, never a loop back to
 * an OTP that has already been used.
 */
export async function completeActivation() {
  await clearPendingActivation();
  await save(StorageKeys.deviceActivated, true);
  // The login response said the device needed activating; it no longer does.
  // Without this, the next launch would route back into the activation flow.
  await updateUser({ deviceActivationRequired: false });
}

export async function isDeviceActivated() {
  return (await load(StorageKeys.deviceActivated)) === true;
}
