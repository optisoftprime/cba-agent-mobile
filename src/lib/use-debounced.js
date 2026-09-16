import { useEffect, useState } from 'react';

/**
 * The value, but only after it has stopped changing for `delay`.
 *
 * Search is server-side, so without this every keystroke is a request — and
 * the replies can land out of order, briefly showing results for a prefix of
 * what was typed.
 */
export function useDebounced(value, delay = 350) {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return settled;
}
