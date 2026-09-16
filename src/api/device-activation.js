import { publicApi, send } from '@/api/client';
import { endpoints } from '@/api/endpoints';

/**
 * Device activation — ezone-agent-service, /api/v1/device-activation/*.
 *
 * All three are pre-login and take no token, so they go through `publicApi`
 * and a 401 from them is an ordinary error, never a reason to sign anyone out.
 *
 * `activate` identifies the agent by `agentCode` in the body. It used to
 * identify them by the bearer token instead, which forced activation to happen
 * after login; the agent code replaced that, so the flow follows the designs
 * again — activate the device, then sign in.
 *
 * Each resolves with the response's `data`: { step, message, agentCode, sentTo }
 * — `sentTo` being the masked destination the OTP went to — and rejects with an
 * ApiError carrying the server's message.
 */

/**
 * Submit the agent code and the activation code from the admin, plus this
 * device's identity. The server binds the device and sends the agent an OTP
 * (to a masked destination it reports back as `sentTo`, e.g. "***3924").
 *
 * Required by the API: agentCode, activationCode, deviceId. The device fields
 * come from src/lib/device.js, not from anything the agent types.
 */
export function activateDevice({
  agentCode,
  activationCode,
  deviceId,
  deviceName,
  platform,
  appVersion,
}) {
  return send(
    publicApi.post(endpoints.deviceActivation.activate, {
      agentCode,
      activationCode,
      deviceId,
      deviceName,
      platform,
      appVersion,
    }),
  );
}

/** "Didn't receive a code?" — send the verification OTP again. */
export function resendActivationOtp({ agentCode }) {
  return send(publicApi.post(endpoints.deviceActivation.resendOtp, { agentCode }));
}

/** Submit the OTP to finish activating the device. */
export function verifyActivationOtp({ agentCode, otp }) {
  return send(publicApi.post(endpoints.deviceActivation.verifyOtp, { agentCode, otp }));
}
