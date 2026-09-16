import Toast from 'react-native-toast-message';

import i18n from '@/i18n';

/**
 * The one way to raise a toast. Screens call `toast.error(title, message)`
 * rather than building Toast.show() payloads by hand, so every toast looks and
 * times the same. Rendering and colours live in components/layout/app-toast.
 *
 * EVERY toast carries two lines — a short heading and the detail beneath it.
 * A single-line toast reads like a system error, and the heading is what the
 * agent actually registers while the toast is sliding past.
 *
 * Called with ONE argument, that argument is the MESSAGE, not the heading:
 * `toast.error(error.message)` is the commonest call in the app, and a raw
 * server string ("Invalid credentials") is detail — never a heading. The
 * heading then comes from the type. That way a lazy call still gets two lines
 * instead of putting a sentence where a title belongs.
 *
 * A toast is for something passing. Anything that FINISHED an operation — a
 * deposit posted, a ticket raised — belongs in `ui/success-modal`, which stays
 * on screen until the agent acknowledges it.
 */

const FALLBACK = {
  success: { title: 'common.toast.successTitle', detail: 'common.toast.successDetail' },
  error: { title: 'common.toast.errorTitle', detail: 'common.errors.generic' },
  info: { title: 'common.toast.infoTitle', detail: 'common.toast.infoDetail' },
};

const isFilled = (value) => typeof value === 'string' && value.trim() !== '';

function show(type, title, message) {
  const fallback = FALLBACK[type] ?? FALLBACK.info;

  // One argument means it was the message.
  const detail = isFilled(message) ? message : title;
  const heading = isFilled(message) && isFilled(title) ? title : i18n.t(fallback.title);

  Toast.show({
    type,
    text1: heading,
    text2: isFilled(detail) ? detail : i18n.t(fallback.detail),
    visibilityTime: type === 'error' ? 5000 : 3500,
  });
}

export const toast = {
  success: (title, message) => show('success', title, message),
  error: (title, message) => show('error', title, message),
  info: (title, message) => show('info', title, message),
  hide: () => Toast.hide(),
};
