import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * A ref that is `true` while this screen is the focused route and `false` once
 * the agent has navigated away. Read it right after an `await` to drop a result
 * that arrived too late to act on.
 *
 * The problem it solves: a screen stays MOUNTED when another is pushed over it,
 * so an in-flight async handler keeps running and will happily navigate from
 * under whatever the agent is now looking at — tap Login, then tap Activate
 * device while it loads, and the finished login yanks them to the dashboard
 * (navigateReplace swaps the CURRENT top screen, which is no longer login).
 *
 * Why a ref, and why useFocusEffect:
 * - A boolean from useState / useIsFocused is captured STALE in the async
 *   closure — it still reads the value from the render that created the handler.
 *   A ref reads live at the moment the await resolves.
 * - useFocusEffect, NOT useEffect, is what tracks focus for a pushed-over screen
 *   that never unmounts — the same reason components/layout/no-going-back uses it.
 *
 *   const focused = useFocusedRef();
 *   const session = await signIn(...);
 *   if (!focused.current) return;   // agent left mid-request; don't yank them back
 *   enterApp(session);
 */
export function useFocusedRef() {
  const focused = useRef(true);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      return () => {
        focused.current = false;
      };
    }, []),
  );

  return focused;
}
