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
 * Raise a ticket.
 *
 * The endpoint changed shape when image upload was added, and it is an unusual
 * one: the TEXT fields are QUERY PARAMETERS and the body is multipart carrying
 * only `image`. Sending the old JSON body silently loses the subject, because
 * the server no longer reads it from there.
 *
 * `image` is `{ uri, name, type }` straight from the picker, or omitted. With
 * no image the body is an empty multipart envelope, which the server accepts —
 * sending NO body at all is a 500, so the FormData always goes.
 *
 * The reporter comes from the token, so it is not sent. Only `subject` is
 * required. FormData is passed through the request interceptor untouched
 * (see `trimDeep`), so the multipart envelope is not mangled.
 */
export function createTicket({ subject, description, categoryId, priority, image }) {
  const form = new FormData();

  if (image?.uri) {
    form.append('image', {
      uri: image.uri,
      name: image.name || 'attachment.jpg',
      type: image.type || 'image/jpeg',
    });
  }

  return send(
    api.post(endpoints.support.tickets, form, {
      params: {
        subject,
        description: description || undefined,
        categoryId: categoryId ?? undefined,
        priority: priority || undefined,
      },
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  );
}
