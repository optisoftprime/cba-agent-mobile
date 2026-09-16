import { api, send } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { nextPageOf, PAGE_SIZE } from '@/api/pagination';

/**
 * Agent Support — /api/v1/agent/support/*.
 *
 * The ticket list carries the three counts (`open`, `inProgress`, `resolved`)
 * alongside a page of tickets, so the tiles and the list are one request.
 */

/** Priorities the create endpoint accepts. */
export const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

function fetchTickets({ status, page = 0, size = PAGE_SIZE }) {
  // `status` is optional; omitted means every ticket.
  return send(api.get(endpoints.support.tickets, { params: { status, page, size } }));
}

/** My tickets + counts, as an infinite query. */
export const ticketsQuery = ({ status } = {}) => ({
  queryKey: ['tickets', { status: status ?? null }],
  queryFn: ({ pageParam = 0 }) => fetchTickets({ status, page: pageParam }),
  initialPageParam: 0,
  getNextPageParam: nextPageOf,
});

/**
 * One ticket with its thread:
 * { ticketNumber, subject, description, category, status, priority,
 *   assignedTo, createdAt, lastActivityAt,
 *   messages: [{ senderType, senderName, body, imageUrl, sentAt }] }
 */
export const ticketQuery = (ticketNumber) => ({
  queryKey: ['ticket', ticketNumber],
  queryFn: () => send(api.get(endpoints.support.ticket(ticketNumber))),
});

/** The Category dropdown: [{ id, name, description }]. */
export const ticketCategoriesQuery = {
  queryKey: ['ticketCategories'],
  queryFn: () => send(api.get(endpoints.support.categories)),
  // Categories change rarely; no need to refetch them on every visit.
  staleTime: 30 * 60 * 1000,
};

/**
 * Raise a ticket. The reporter is taken from the token, so it isn't sent.
 * Only `subject` is required by the server; `categoryId` is the numeric id
 * from ticketCategoriesQuery, and `priority` one of TICKET_PRIORITIES.
 */
export function createTicket({ subject, description, categoryId, priority, imageUrl }) {
  return send(
    api.post(endpoints.support.tickets, {
      subject,
      description,
      categoryId,
      priority,
      imageUrl,
    }),
  );
}
