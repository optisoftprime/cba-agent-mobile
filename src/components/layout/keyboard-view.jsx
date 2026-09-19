import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

/**
 * THE keyboard-avoiding wrapper. Every screen that takes typed input uses this
 * one, so a form can never be left with the keyboard sitting on top of it.
 *
 * NOT React Native's own `KeyboardAvoidingView`. From Expo SDK 54 Android runs
 * edge-to-edge, which means the window is no longer resized when the keyboard
 * opens — and the usual `behavior={Platform.OS === 'ios' ? 'padding' :
 * undefined}` therefore does NOTHING on Android. Fields simply disappear behind
 * the keyboard, which is what made typing in this app annoying. The
 * keyboard-controller build measures the keyboard itself on both platforms, so
 * one `behavior="padding"` is correct everywhere.
 *
 * It needs `KeyboardProvider` mounted at the root — it is, in AppProviders.
 *
 * Pair it with a scroller that sets `keyboardShouldPersistTaps="handled"`:
 * without that, the first tap on a button or list row while the keyboard is up
 * is swallowed dismissing the keyboard, and the agent has to tap twice.
 */
export function KeyboardView({ children, className = 'flex-1', offset = 0, ...props }) {
  return (
    <KeyboardAvoidingView
      className={className}
      behavior="padding"
      keyboardVerticalOffset={offset}
      {...props}>
      {children}
    </KeyboardAvoidingView>
  );
}
