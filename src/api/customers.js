import { api, send } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { nextPageOf, PAGE_SIZE } from '@/api/pagination';

/**
 * Agent Customers — /api/v1/agent/customers.
 *
 * Confirmed against the live service:
 *   • `search` is SERVER-side and matches name, customer code or phone. An
 *     empty string returns everything, so it can be sent unconditionally.
 *   • `filter` accepts ALL | ACTIVE | INACTIVE | SME only; anything else is a
 *     400 naming the accepted values.
 *   • A page past the end returns an empty array, not an error.
 *   • The detail tabs are NOT paginated — plain arrays.
 *   • An unknown customerCode is a 404 "Customer not found".
 */

/** Filter values the server accepts, keyed by the chip we show. */
export const CUSTOMER_FILTERS = {
  all: 'ALL',
  active: 'ACTIVE',
  inactive: 'INACTIVE',
  sme: 'SME',
};

function fetchCustomers({ search = '', filter = 'ALL', page = 0, size = PAGE_SIZE }) {
  return send(
    api.get(endpoints.customers.list, { params: { search, filter, page, size } }),
  );
}

/** The list, as an infinite query. Spread into useInfiniteQuery. */
export const customersQuery = ({ search, filter }) => ({
  queryKey: ['customers', { search, filter }],
  queryFn: ({ pageParam = 0 }) => fetchCustomers({ search, filter, page: pageParam }),
  initialPageParam: 0,
  getNextPageParam: nextPageOf,
});

/** Header card: { customerCode, name, phone, segment, status }. */
export const customerQuery = (customerCode) => ({
  queryKey: ['customer', customerCode],
  queryFn: () => send(api.get(endpoints.customers.detail(customerCode))),
});

/** Overview tab: the header fields plus counts, balance and `primaryLoan`. */
export const customerOverviewQuery = (customerCode) => ({
  queryKey: ['customer', customerCode, 'overview'],
  queryFn: () => send(api.get(endpoints.customers.overview(customerCode))),
});

/** Account tab: [{ accountName, accountNumber, currentBalance, status }]. */
export const customerAccountsQuery = (customerCode) => ({
  queryKey: ['customer', customerCode, 'accounts'],
  queryFn: () => send(api.get(endpoints.customers.accounts(customerCode))),
});

/** Loans tab: [{ loanCode, product, accountNumber, principal, outstanding, status }]. */
export const customerLoansQuery = (customerCode) => ({
  queryKey: ['customer', customerCode, 'loans'],
  queryFn: () => send(api.get(endpoints.customers.loans(customerCode))),
});

/**
 * Activity tab: [{ type, title, detail, occurredAt }].
 * `detail` arrives already formatted ("₦5500 on LID72037439") — display it
 * as-is rather than re-formatting the amount out of it.
 */
export const customerActivityQuery = (customerCode) => ({
  queryKey: ['customer', customerCode, 'activity'],
  queryFn: () => send(api.get(endpoints.customers.activity(customerCode))),
});
