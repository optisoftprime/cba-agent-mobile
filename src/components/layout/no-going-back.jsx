import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';

/**
 * Drop this into a screen that ends a process — an activated device, a posted
 * deposit — so there is no way back into it.
 *
 * Closes every route backwards:
 *   • Android's hardware back button (BackHandler, returning true consumes it)
 *   • iOS's swipe-from-the-edge (gestureEnabled: false)
 *
 * Registered only WHILE FOCUSED, via useFocusEffect. A pushed-over screen stays
 * mounted, so a plain useEffect would leave this screen swallowing the back
 * button of whatever is on top of it — e.g. the deposit receipt opened from the
 * success screen would become impossible to leave.
 *
 * `onBack` makes the back button do the same thing as the screen's own action
 * (usually leaving the flow forward), which beats a button that appears broken.
 * Without it, back is simply ignored.
 *
 * This blocks the gesture; it does NOT clear the stack. Pair it with
 * navigateReset() on the screen's action so the finished screens are gone.
 */
export function NoGoingBack({ onBack }) {
  // Held in a ref so a new inline callback on each render doesn't tear down
  // and re-register the listener. Written in an effect, not during render.
  const onBackRef = useRef(onBack);
  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        onBackRef.current?.();
        return true; // consumed either way — never fall through to the stack
      });

      return () => subscription.remove();
    }, []),
  );

  return <Stack.Screen options={{ gestureEnabled: false }} />;
}
