import { useQuery } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { useTranslation } from 'react-i18next';

import { setPermissionDeniedHandler } from '@/api/client';
import { permissionsQuery } from '@/api/permissions';
import { useAuth } from '@/providers/auth-provider';
import { PermissionDeniedModal } from '@/components/ui/permission-denied-modal';

/**
 * What the signed-in agent may do, and the one place that says no.
 *
 * `guard(code, action)` is the whole API. It runs the action when the agent
 * has the permission, and otherwise opens a modal telling them to speak to
 * their administrator. Every entry point calls it, so there is one behaviour
 * and one piece of copy for "you cannot do this" rather than each screen
 * inventing its own.
 *
 * The button is NOT hidden when a permission is missing. An agent who cannot
 * see the control assumes the app is broken or that the feature does not
 * exist; one who taps it and is told why can go and ask for access. It also
 * means the UI does not silently change shape between agents.
 *
 * This is a courtesy, not a security boundary — the server refuses a forbidden
 * action regardless. The point is that the agent finds out before filling in a
 * form and counting out cash.
 *
 * ── Keeping it current ──────────────────────────────────────────────────
 * An administrator can change a permission while the agent is mid-shift, so a
 * stale copy is the failure mode to design against. It is re-fetched:
 *
 *   - when the server refuses a call (below) — the local copy was wrong by
 *     definition, so correct it immediately;
 *   - when the app returns to the foreground, which covers the agent putting
 *     the phone down while an administrator changes something;
 *   - on pull-to-refresh, via `useRefreshWithPermissions`.
 */
const PermissionContext = createContext(null);

export function PermissionProvider({ children }) {
  const { t } = useTranslation();
  // This provider sits above the whole router, so without a gate it would ask
  // on the LOGIN screen too — on a launch, on every foreground, and again the
  // moment sign-out clears the cache. With a revoked token that stray 401
  // raised "session expired" over the splash, a toast for a check the agent
  // never asked for, racing the splash's own routing.
  const { user } = useAuth();
  const { data, isSuccess, refetch } = useQuery({
    ...permissionsQuery,
    enabled: Boolean(user),
  });

  // The code the agent just tried to use. `null` = nothing refused; a code
  // names the feature; `''` means the SERVER refused and `serverMessage` has
  // the wording.
  const [deniedCode, setDeniedCode] = useState(null);
  const [serverMessage, setServerMessage] = useState(null);

  const granted = useMemo(
    () => new Set((data ?? []).map((entry) => entry?.code).filter(Boolean)),
    [data],
  );

  /** Re-ask the server what this agent may do. Safe to call often. */
  const refresh = useCallback(() => refetch(), [refetch]);

  /**
   * Until the list has actually ARRIVED we answer TRUE — not merely while it is
   * in flight. A phone out of coverage never gets an answer, and an agent whose
   * whole app locked itself because one request failed would be stranded in the
   * field with no way back. `isSuccess` stays true once a list has loaded, so a
   * later refresh that fails keeps the last known answer rather than reverting
   * to "allow everything".
   */
  const can = useCallback(
    (code) => {
      if (!code) return true;
      if (!isSuccess) return true;
      return granted.has(code);
    },
    [granted, isSuccess],
  );

  const guard = useCallback(
    (code, action) => {
      if (can(code)) return action?.();
      setDeniedCode(code);
      return undefined;
    },
    [can],
  );

  // The server refusing a call lands here, so a permission changed mid-session
  // shows the same modal as one the app knew about — rather than signing the
  // agent out, which a bare 401 would otherwise do. See `isPermissionRefusal`
  // in src/api/client.js.
  useEffect(() => {
    setPermissionDeniedHandler((message) => {
      setServerMessage(message ?? null);
      setDeniedCode('');
      // Our copy was demonstrably wrong — pull the real one so the rest of the
      // app stops offering whatever was just refused.
      refresh();
    });
    return () => setPermissionDeniedHandler(null);
  }, [refresh]);

  // Catches an administrator changing something while the app was backgrounded.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const close = useCallback(() => {
    setDeniedCode(null);
    setServerMessage(null);
  }, []);

  const value = useMemo(() => ({ can, guard, refresh }), [can, guard, refresh]);

  return (
    <PermissionContext.Provider value={value}>
      {children}

      <PermissionDeniedModal
        visible={deniedCode !== null}
        // The API only returns labels for permissions the agent HAS, so a
        // denied one has no label to borrow — it comes from the locale files.
        // When the SERVER refused the call we have its words instead, which
        // are more specific than anything we could name locally.
        feature={
          serverMessage ||
          (deniedCode ? t(`permissions.codes.${deniedCode}`, { defaultValue: '' }) : '')
        }
        rawMessage={Boolean(serverMessage)}
        onClose={close}
      />
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) throw new Error('usePermissions must be used inside PermissionProvider');
  return context;
}


/**
 * Everything one gated control needs, in one call.
 *
 *   const ajo = usePermission(Permission.ajo);
 *   <QuickAction className={ajo.lockedClass} onPress={ajo.press(() => navigateTo('/ajo'))} />
 *
 * `lockedClass` fades the control so the agent can SEE it is not theirs before
 * tapping, and `press` still opens the modal when they do — faded, not hidden
 * and not inert, so the reason is always one tap away.
 */
export function usePermission(code) {
  const { can, guard } = usePermissions();
  const allowed = can(code);

  const press = useCallback((action) => () => guard(code, action), [guard, code]);

  return useMemo(
    () => ({
      allowed,
      // Muted enough to read as unavailable, not so faint it looks broken.
      lockedClass: allowed ? '' : 'opacity-50',
      press,
    }),
    [allowed, press],
  );
}

/**
 * Wraps a screen's `refetch` so pulling to refresh re-checks permissions too.
 *
 *   const onRefresh = useRefreshWithPermissions(refetch);
 *   <FlatList onRefresh={onRefresh} ... />
 *
 * Exists so no screen has to remember to do it by hand — which is exactly how
 * one screen ends up refreshing permissions and the next one doesn't.
 */
export function useRefreshWithPermissions(refetch) {
  const { refresh } = usePermissions();

  return useCallback(() => {
    refresh();
    return refetch?.();
  }, [refresh, refetch]);
}
