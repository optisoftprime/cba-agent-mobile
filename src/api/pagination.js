/**
 * Every paginated list on this backend answers with the same envelope:
 *
 *   { totalElements, totalPages, page, size, <items> }
 *
 * where <items> is named after the resource (`customers`, `loans`, …). These
 * helpers turn that into what useInfiniteQuery expects, so each list screen
 * only has to say which endpoint and which item key.
 */

/** Page numbers are zero-based; returning undefined stops the fetching. */
export function nextPageOf(lastPage) {
  if (!lastPage) return undefined;
  const next = (lastPage.page ?? 0) + 1;
  return next < (lastPage.totalPages ?? 0) ? next : undefined;
}

/** Every loaded page's items, flattened into one list. */
export function itemsOf(data, key) {
  return data?.pages?.flatMap((page) => page?.[key] ?? []) ?? [];
}

/** The server's total — the count to show, not the number loaded so far. */
export function totalOf(data) {
  return data?.pages?.[0]?.totalElements ?? 0;
}

/**
 * Default page size. The server defaults to 20; we ask for 30 so the first
 * screenful is always filled — on a tall handset 20 rows can stop just short of
 * the fold, and a list that doesn't overflow never fires `onEndReached`, so it
 * looks like there is no more data. Every page uses it, not just the first.
 */
export const PAGE_SIZE = 30;
