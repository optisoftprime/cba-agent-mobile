import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { fetchAgentProfile, login as loginRequest } from '@/api/agent-auth';
import { setSessionExpiredHandler } from '@/api/client';
import i18n from '@/i18n';
import { authenticateWithBiometrics } from '@/lib/biometrics';
import { navigateReplace } from '@/lib/navigate';
import { applyProfile, clearSession, getUser, saveSession } from '@/lib/session';
import { toast } from '@/lib/toast';

/**
 * Who is signed in.
 *
 * The session itself lives in SecureStore (src/lib/session.js) and is restored
 * on launch; this provider is the in-memory view of it plus the operations
 * that change it.
 *
 * Nothing about the agent is kept outside the session: signing out — or a
 * token the server rejects — leaves the login screen knowing nobody.
 */

const AuthContext = createContext(undefined);

/**
 * Does this token belong to someone other than the agent stored on the device?
 *
 * Compares like with like: `agentCode` is the identity, and email is only
 * consulted when one side has no agentCode. Comparing a stored agentCode
 * against a returned email would flag every response that omits the code as an
 * impostor and sign a legitimate agent out.
 */
function identityChanged(session, profile) {
  if (!profile) return false;

  if (session.agentCode && profile.agentCode) {
    return session.agentCode !== profile.agentCode;
  }

  const stored = session.email?.toLowerCase();
  const returned = profile.email?.toLowerCase();
  return Boolean(stored && returned && stored !== returned);
}

/** What a startup token check concluded. */
export const SessionStatus = {
  /** Nothing stored — go to login. */
  signedOut: 'signed-out',
  /** The server accepted the token. */
  valid: 'valid',
  /** The server rejected it; the session has been cleared. */
  expired: 'expired',
  /** The token is valid but belongs to a different agent; the session has been cleared. */
  mismatch: 'mismatch',
  /** Couldn't reach the server. The session stands and the app opens offline. */
  unverified: 'unverified',
};

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore whatever was stored, before anything renders a signed-in screen.
  useEffect(() => {
    (async () => {
      try {
        setUser(await getUser());
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  /**
   * Sign in with email + password.
   *
   * Resolves with the raw login response so the caller can route on
   * `deviceActivationRequired`. Rejects with an ApiError whose message is the
   * server's and is safe to show.
   */
  const signIn = useCallback(
    async ({ email, password }) => {
      const data = await loginRequest({ email, password });
      // Nothing cached belongs to this session yet. Clearing here means the
      // first screen loads the incoming agent's data, never the last one's.
      queryClient.clear();
      setUser(await saveSession(data));
      return data;
    },
    [queryClient],
  );

  /** Clears the session. Preferences (theme, language) are untouched. */
  const signOut = useCallback(async () => {
    await clearSession();
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  /**
   * Ask the server whether the stored token still works, and refresh the
   * agent's details from the answer.
   *
   * Runs silently. The agent didn't ask for this check, so a rejected token
   * just clears the session and the caller routes to login — no toast, no
   * "session expired" for something that happened while the splash was up.
   *
   * Any other failure (offline, server down) deliberately KEEPS the session:
   * being unable to reach the server is not proof of being signed out.
   */
  const verifySession = useCallback(async () => {
    const session = await getUser();
    if (!session?.accessToken) {
      setUser(null);
      return SessionStatus.signedOut;
    }

    try {
      const profile = await fetchAgentProfile({ silent: true });

      // The token is good — but is it still THIS agent's? A token re-issued to
      // someone else, or a device handed over without a proper sign-out, would
      // otherwise leave one agent looking at another's name, customers and
      // collections. Identity is the agentCode; email is the fallback for a
      // response that omits it.
      if (identityChanged(session, profile)) {
        if (__DEV__) {
          console.warn(
            `[auth] session is for ${session.agentCode ?? session.email} but the token is ` +
              `${profile?.agentCode ?? profile?.email} — signing out`,
          );
        }
        await clearSession();
        setUser(null);
        return SessionStatus.mismatch;
      }

      setUser(await applyProfile(profile));
      return SessionStatus.valid;
    } catch (error) {
      // The server rejected the token: the session is over.
      if (error?.status === 401) {
        await clearSession();
        setUser(null);
        return SessionStatus.expired;
      }

      // Anything else (offline, server down) is not proof of being signed out.
      setUser(session);
      return SessionStatus.unverified;
    }
  }, []);

  /** Re-read the stored session, e.g. after finishing device activation. */
  const refreshUser = useCallback(async () => {
    const session = await getUser();
    setUser(session);
    return session;
  }, []);

  /** Unlock an existing session with a face/fingerprint. */
  const unlockWithBiometrics = useCallback(
    async (promptMessage) => {
      const session = await getUser();
      if (!session) return false;

      const passed = await authenticateWithBiometrics(promptMessage);
      if (!passed) return false;

      // Unlocking is an entry point too: whatever was cached is from an older
      // session and may be hours stale, so the screens refetch.
      queryClient.clear();
      setUser(session);
      return true;
    },
    [queryClient],
  );

  // A 401 from any signed-in call lands here (see src/api/client.js). Calls on
  // publicApi — login, resend/verify OTP — never trigger it.
  useEffect(() => {
    setSessionExpiredHandler(async () => {
      await signOut();
      toast.error(
        i18n.t('common.errors.sessionExpiredTitle'),
        i18n.t('common.errors.sessionExpired'),
      );
      navigateReplace('/(auth)/login');
    });
    return () => setSessionExpiredHandler(null);
  }, [signOut]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      signIn,
      signOut,
      verifySession,
      refreshUser,
      unlockWithBiometrics,
    }),
    [user, isLoading, signIn, signOut, verifySession, refreshUser, unlockWithBiometrics],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
