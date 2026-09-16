import { api, send } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { nextPageOf, PAGE_SIZE } from '@/api/pagination';

/**
 * Agent Collections — /api/v1/agent/collections.
 *
 * One call feeds the whole screen: the four total tiles AND a page of history.
 * The tiles (`today`, `thisWeek`, `thisMonth`, `totalCollected`) come back on
 * every page, so they are read from the FIRST page only — later pages repeat
 * them and reading the last one would be just as correct but needlessly odd.
 */

/** Chip -> server value for the history tabs. */
export const COLLECTION_TYPES = {
  all: 'ALL',
  deposit: 'DEPOSIT',
  ajo: 'AJO',
};

/** Dropdown -> server value for the period. */
export const COLLECTION_PERIODS = {
  today: 'TODAY',
  week: 'WEEK',
  month: 'MONTH',
  all: 'ALL',
};

function fetchCollections({ type = 'ALL', period = 'TODAY', page = 0, size = PAGE_SIZE }) {
  return send(api.get(endpoints.collections.list, { params: { type, period, page, size } }));
}

/** History as an infinite query; the tiles ride along on page 0. */
export const collectionsQuery = ({ type, period }) => ({
  queryKey: ['collections', { type, period }],
  queryFn: ({ pageParam = 0 }) => fetchCollections({ type, period, page: pageParam }),
  initialPageParam: 0,
  getNextPageParam: nextPageOf,
});

/**
 * One movement:
 * { reference, amount, type, customerName, account, capturedAt,
 *   paymentMethod, transactionId, status }
 */
export const collectionQuery = (reference) => ({
  queryKey: ['collection', reference],
  queryFn: () => send(api.get(endpoints.collections.detail(reference))),
});
