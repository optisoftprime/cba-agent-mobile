import { api, BASE_URL, getErrorMessage } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import i18n from '@/i18n';

/**
 * Auth requests.
 *
 * ─── While there is no backend ───────────────────────────────────────────────
 * EXPO_PUBLIC_API_URL is unset, so every call below short-circuits to a stub
 * and the screens are fully clickable: log in walks you to the dashboard,
 * register device returns you to log in. Nothing errors.
 *
 * Set EXPO_PUBLIC_API_URL (see .env.example) and every one of these switches to
 * the real endpoint automatically — no screen changes, nothing to delete. That
 * is the only thing this flag does; it never alters what a screen renders.
 *
 * TODO: confirm request/response bodies against the backend contract; the
 * fields below are what the designs imply.
 */
const HAS_BACKEND = Boolean(BASE_URL);

/** A session shaped like the real login response, so the app behaves normally. */
function stubSession(email) {
  return {
    accessToken: 'stub.access.token',
    refreshToken: 'stub.refresh.token',
    user: {
      id: 'stub-agent',
      code: 'AG-00125',
      firstName: 'John',
      lastName: 'Adeyemi',
      email,
    },
  };
}

/** Wrap an axios failure in a message that's safe to show the user. */
function toUserError(error) {
  return new Error(getErrorMessage(error, i18n.t('auth.errors.generic')));
}

export async function loginRequest({ email, password }) {
  if (!HAS_BACKEND) return stubSession(email);

  try {
    const { data } = await api.post(endpoints.auth.login, { email, password });
    return data;
  } catch (error) {
    throw toUserError(error);
  }
}

/** Exchange the activation code from the admin for a registered device. */
export async function activateDeviceRequest({ code }) {
  if (!HAS_BACKEND) return { activated: true };

  try {
    const { data } = await api.post(endpoints.auth.activateDevice, { code });
    return data;
  } catch (error) {
    throw toUserError(error);
  }
}

export async function forgotPasswordRequest({ email }) {
  if (!HAS_BACKEND) return { sent: true };

  try {
    const { data } = await api.post(endpoints.auth.forgotPassword, { email });
    return data;
  } catch (error) {
    throw toUserError(error);
  }
}
