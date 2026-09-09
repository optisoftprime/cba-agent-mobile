/** Central list of API paths so screens never hard-code URLs. */
export const endpoints = {
  auth: {
    login: '/auth/login',
    refresh: '/auth/refresh',
    profile: '/auth/profile',
    activateDevice: '/auth/activate-device',
    forgotPassword: '/auth/forgot-password',
  },
  dashboard: {
    summary: '/agent/dashboard',
  },
};
