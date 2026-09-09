import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/** Tokens and anything sensitive. Falls back to AsyncStorage on web, where SecureStore is unavailable. */
export const secureStorage = {
  async get(key) {
    if (Platform.OS === 'web') return AsyncStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async set(key, value) {
    if (Platform.OS === 'web') return AsyncStorage.setItem(key, value);
    return SecureStore.setItemAsync(key, value);
  },
  async remove(key) {
    if (Platform.OS === 'web') return AsyncStorage.removeItem(key);
    return SecureStore.deleteItemAsync(key);
  },
};

/** Plain preferences — theme mode, language. Never used for tokens. */
export const storage = {
  async get(key) {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async set(key, value) {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // non-fatal: the choice still applies for this session
    }
  },
  async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // non-fatal
    }
  },
};

export const StorageKeys = {
  accessToken: 'cba.accessToken',
  refreshToken: 'cba.refreshToken',
  user: 'cba.user',
  themeMode: 'cba.themeMode',
  language: 'cba.language',
  lastUserName: 'cba.lastUserName',
};
