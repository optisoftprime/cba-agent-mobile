import { create, isAxiosError } from 'axios';

import { secureStorage, StorageKeys } from '@/lib/storage';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export const api = create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await secureStorage.get(StorageKeys.accessToken);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // TODO: handle 401 refresh/sign-out once the auth endpoints are confirmed.
    return Promise.reject(error);
  },
);

export function getErrorMessage(error, fallback = 'Something went wrong') {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
