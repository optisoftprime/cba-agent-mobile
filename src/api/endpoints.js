/**
 * Every API path, appended to BASE_URL (src/config/backend.js).
 *
 * Taken from the service's OpenAPI doc, not from guesses:
 * https://gateway.ezoneapps.com:30002/ezone-agent-service/v3/api-docs
 *
 * Whether a call needs a token is decided by the client it uses — publicApi or
 * api, see src/api/client.js — not by this file.
 *
 * Paths with a path parameter are functions, and encode it: a customer code
 * like `I-OPT-6390` is safe, but nothing guarantees the next one will be.
 */
export const endpoints = {
  agent: {
    /** Sign in. Returns the token, the agent's details, and whether the device needs activating. */
    login: '/api/v1/agent/auth/login',
    /** The signed-in agent's profile. Doubles as the "is this token still good?" check. */
    profile: '/api/v1/agent/profile',
  },

  deviceActivation: {
    activate: '/api/v1/device-activation/activate',
    resendOtp: '/api/v1/device-activation/resend-otp',
    verifyOtp: '/api/v1/device-activation/verify-otp',
  },

  dashboard: {
    summary: '/api/v1/agent/dashboard',
  },

  loans: {
    list: '/api/v1/agent/loans',
    overview: (code) => `/api/v1/agent/loans/${encodeURIComponent(code)}/overview`,
    schedule: (code) => `/api/v1/agent/loans/${encodeURIComponent(code)}/schedule`,
    activity: (code) => `/api/v1/agent/loans/${encodeURIComponent(code)}/activity`,
  },

  collections: {
    list: '/api/v1/agent/collections',
    detail: (reference) => `/api/v1/agent/collections/${encodeURIComponent(reference)}`,
  },

  support: {
    tickets: '/api/v1/agent/support/tickets',
    ticket: (number) => `/api/v1/agent/support/tickets/${encodeURIComponent(number)}`,
    categories: '/api/v1/agent/support/categories',
  },

  notifications: {
    list: '/api/v1/agent/notifications',
    read: (reference) => `/api/v1/agent/notifications/${encodeURIComponent(reference)}/read`,
    readAll: '/api/v1/agent/notifications/read-all',
  },

  ajo: {
    /** Tiles + the agent's active plans. Not paginated. */
    home: '/api/v1/agent/ajo',
    create: '/api/v1/agent/ajo',
    plan: (reference) => `/api/v1/agent/ajo/${encodeURIComponent(reference)}`,
    contributions: (reference) =>
      `/api/v1/agent/ajo/${encodeURIComponent(reference)}/contributions`,
  },

  customers: {
    list: '/api/v1/agent/customers',
    detail: (code) => `/api/v1/agent/customers/${encodeURIComponent(code)}`,
    overview: (code) => `/api/v1/agent/customers/${encodeURIComponent(code)}/overview`,
    accounts: (code) => `/api/v1/agent/customers/${encodeURIComponent(code)}/accounts`,
    loans: (code) => `/api/v1/agent/customers/${encodeURIComponent(code)}/loans`,
    activity: (code) => `/api/v1/agent/customers/${encodeURIComponent(code)}/activity`,
  },
};
