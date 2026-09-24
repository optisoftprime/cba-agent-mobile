/**
 * How an end-of-day variance reads, in one place.
 *
 * `variance = countedCash − expectedCash`, so:
 *   positive → the agent holds MORE than finman expects  ("over")
 *   negative → the agent holds LESS                       ("short")
 *   zero     → balanced
 *
 * Shared by the EOD screen, its history list and the success modal, so a
 * shortfall can never read as red in one place and amber in another.
 */

/** Half a kobo — anything smaller is floating-point noise, not a real difference. */
const EPSILON = 0.005;

/**
 * `unknown` is NOT `balanced`. A day that has not been counted yet comes back
 * with `variance: null`, and `Number(null)` is 0 — so without this check an
 * un-submitted day in the history list would read a confident green
 * "Balanced", which is the one line the agent is scanning for.
 *
 * @returns {{ kind: 'unknown' | 'balanced' | 'over' | 'short', amount: number }}
 */
export function describeVariance(variance) {
  if (variance === null || variance === undefined) return { kind: 'unknown', amount: 0 };

  const value = Number(variance);
  if (!Number.isFinite(value)) return { kind: 'unknown', amount: 0 };
  if (Math.abs(value) < EPSILON) return { kind: 'balanced', amount: 0 };

  return { kind: value > 0 ? 'over' : 'short', amount: Math.abs(value) };
}

/**
 * Short is the one to worry about — cash is missing. Over is still a mismatch
 * that has to be explained, so it is flagged, just less loudly.
 */
export const VARIANCE_TEXT_CLASS = {
  unknown: 'text-ink-muted',
  balanced: 'text-success',
  over: 'text-warning',
  short: 'text-danger',
};
