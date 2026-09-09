import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { loginRequest } from '@/api/auth';
import { authenticateWithBiometrics } from '@/lib/biometrics';
import { secureStorage, StorageKeys, storage } from '@/lib/storage';

/**
 * Session state.
 *
 * Two things survive a relaunch:
 *   • the session itself (token + user) — SecureStore
 *   • the last signed-in first name — AsyncStorage, so the login screen can say
 *     "Hello John," after a sign-out. Deliberately NOT in SecureStore: it is a
 *     display nicety, not a credential.
 */

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUserName, setLastUserName] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [token, storedUser, name] = await Promise.all([
          secureStorage.get(StorageKeys.accessToken),
          secureStorage.get(StorageKeys.user),
          storage.get(StorageKeys.lastUserName),
        ]);
        setLastUserName(name);
        if (token && storedUser) setUser(JSON.parse(storedUser));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persistSession = useCallback(async (token, nextUser, refreshToken) => {
    await Promise.all([
      secureStorage.set(StorageKeys.accessToken, token),
      secureStorage.set(StorageKeys.user, JSON.stringify(nextUser)),
      refreshToken ? secureStorage.set(StorageKeys.refreshToken, refreshToken) : Promise.resolve(),
    ]);

    if (nextUser?.firstName) {
      await storage.set(StorageKeys.lastUserName, nextUser.firstName);
      setLastUserName(nextUser.firstName);
    }

    setUser(nextUser);
  }, []);

  const signInWithPassword = useCallback(
    async ({ email, password }) => {
      const data = await loginRequest({ email, password });
      await persistSession(data.accessToken, data.user, data.refreshToken);
    },
    [persistSession],
  );

  /** Unlock a kept session with a face/fingerprint. Not surfaced in the current designs. */
  const signInWithBiometrics = useCallback(async (promptMessage) => {
    const passed = await authenticateWithBiometrics(promptMessage);
    if (!passed) return false;

    const storedUser = await secureStorage.get(StorageKeys.user);
    if (!storedUser) return false;

    setUser(JSON.parse(storedUser));
    return true;
  }, []);

  /** Clears the session. The name survives so the next login still greets them. */
  const signOut = useCallback(async () => {
    await Promise.all([
      secureStorage.remove(StorageKeys.accessToken),
      secureStorage.remove(StorageKeys.refreshToken),
      secureStorage.remove(StorageKeys.user),
    ]);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      lastUserName,
      signInWithPassword,
      signInWithBiometrics,
      signOut,
    }),
    [user, isLoading, lastUserName, signInWithPassword, signInWithBiometrics, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
