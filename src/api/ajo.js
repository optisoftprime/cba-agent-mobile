import { api, send } from '@/api/client';
import { endpoints } from '@/api/endpoints';

/**
 * Agent Ajo — /api/v1/agent/ajo.
 *
 * One call feeds the whole home screen: the four tiles (`todaysExpected`,
 * `collectedToday`, `activeAjo`, `pending`) AND the agent's active plans.
 *
 * NOTE: unlike every other list on this backend, `plans` is NOT paginated —
 * the endpoint takes no `page`/`size` and answers with a plain array, so there
 * is nothing to scroll into. That is the one documented exception to the
 * infinite-scroll rule in AGENTS.md; if the backend ever adds paging here,
 * this moves onto `useInfiniteQuery` like the rest.
 */

/** Contribution frequencies the create endpoint accepts. */
export const AJO_FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY'];

/**
 * Tiles + plans:
 * { todaysExpected, collectedToday, activeAjo, pending,
 *   plans: [{ reference, customerName, planName, duration, frequency,
 *             contributionAmount, contributionsMade, contributedTotal,
 *             expectedTotal, status }] }
 */
export const ajoHomeQuery = {
  queryKey: ['ajo'],
  queryFn: () => send(api.get(endpoints.ajo.home)),
};

/**
 * One plan:
 * { reference, customerCode, customerName, planName, frequency, duration,
 *   contributionAmount, startDate, maturityDate, expectedTotal,
 *   contributionsMade, contributedTotal, remaining, status }
 */
export const ajoPlanQuery = (reference) => ({
  queryKey: ['ajoPlan', reference],
  queryFn: () => send(api.get(endpoints.ajo.plan(reference))),
});

/**
 * Create a plan. `maturityDate` and `expectedTotal` are computed server-side,
 * so they are never sent. Required by the server: customerCode, planName,
 * frequency, contributionAmount, startDate — `duration` is optional.
 * `startDate` is a plain date, `YYYY-MM-DD`.
 */
export function createAjoPlan({
  customerCode,
  planName,
  frequency,
  duration,
  contributionAmount,
  startDate,
}) {
  return send(
    api.post(endpoints.ajo.create, {
      customerCode,
      planName,
      frequency,
      duration,
      contributionAmount,
      startDate,
    }),
  );
}

/**
 * Record a contribution against a plan. This also posts an Ajo_Contribution
 * collection server-side, so the collections screen and the dashboard figures
 * change too — invalidate them, not just the plan.
 *
 * Resolves with the updated plan (same shape as ajoPlanQuery).
 */
export function recordAjoContribution({ reference, amount }) {
  return send(api.post(endpoints.ajo.contributions(reference), { amount }));
}
