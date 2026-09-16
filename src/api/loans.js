import { api, send } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { nextPageOf, PAGE_SIZE } from '@/api/pagination';

/**
 * Agent Customer Loans — /api/v1/agent/loans.
 *
 * Confirmed against the live service:
 *   • `filter` accepts ALL | ACTIVE | DUE | OVERDUE; anything else is a 400
 *     naming the accepted values.
 *   • `search` matches loan code and customer name. It did NOT match product
 *     ("Loan" returned 0 of 11), despite the docs saying it does.
 *   • Statuses come from core banking in mixed case: OVERDUE, Performing,
 *     Running, Processing, Completed — see LOAN_STATUS_TONE.
 *   • The detail tabs are plain arrays, not paginated.
 *   • An unknown loanCode is a 404 "Loan not found".
 */

/** Filter values the server accepts, keyed by the chip we show. */
export const LOAN_FILTERS = {
  all: 'ALL',
  active: 'ACTIVE',
  due: 'DUE',
  overdue: 'OVERDUE',
};

function fetchLoans({ search = '', filter = 'ALL', page = 0, size = PAGE_SIZE }) {
  return send(api.get(endpoints.loans.list, { params: { search, filter, page, size } }));
}

/** The list, as an infinite query. Spread into useInfiniteQuery. */
export const loansQuery = ({ search, filter }) => ({
  queryKey: ['loans', { search, filter }],
  queryFn: ({ pageParam = 0 }) => fetchLoans({ search, filter, page: pageParam }),
  initialPageParam: 0,
  getNextPageParam: nextPageOf,
});

/**
 * Overview tab: { loanCode, customerName, customerCode, product, principal,
 * outstanding, interestRate, tenure, tenureType, monthlyRepayment,
 * nextPaymentAmount, nextDueDate, maturityDate, status }.
 *
 * `interestRate` is a number (10, not "10%"), and the term is two fields —
 * `tenure` plus `tenureType` ("Weekly", "Monthly").
 */
export const loanOverviewQuery = (loanCode) => ({
  queryKey: ['loan', loanCode, 'overview'],
  queryFn: () => send(api.get(endpoints.loans.overview(loanCode))),
});

/** Repayment tab: [{ dueDate, principalAmount, interestAmount, totalDue, amountPaid, status }]. */
export const loanScheduleQuery = (loanCode) => ({
  queryKey: ['loan', loanCode, 'schedule'],
  queryFn: () => send(api.get(endpoints.loans.schedule(loanCode))),
});

/** Activity tab: [{ type, title, detail, occurredAt }] — `detail` is pre-formatted. */
export const loanActivityQuery = (loanCode) => ({
  queryKey: ['loan', loanCode, 'activity'],
  queryFn: () => send(api.get(endpoints.loans.activity(loanCode))),
});
