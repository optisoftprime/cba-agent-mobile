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

/** The picker's base64 as the `imageUrl` data URI the ticket endpoints take. */
function imageDataUri(image) {
  if (!image?.base64) return undefined;
  return `data:${image.type || 'image/jpeg'};base64,${image.base64}`;
}

/**
 * Raise a ticket. The reporter comes from the token; only `subject` is required.
 *
 * ONE JSON body, always: `{ subject, description, categoryId, priority, imageUrl }`.
 * The server reads every field from this body and saves `description` exactly as
 * received. An attached image rides along as `imageUrl` — a base64 data URI the
 * picker produces (src/lib/image-picker) — not a multipart file part.
 *
 * This replaced an earlier form that sent the fields as QUERY params with the
 * image as a multipart part. Sending a field two ways is how `description`
 * arrived DOUBLED ("text, text" — the server joins repeated params with ", ");
 * one JSON string cannot double. (Reported & confirmed app-side, 2026-10-20.)
 */
export function createTicket({ subject, description, categoryId, priority, image }) {
  return send(
    api.post(endpoints.support.tickets, {
      subject,
      description: description || undefined,
      categoryId: categoryId ?? undefined,
      priority: priority || undefined,
      imageUrl: imageDataUri(image),
    }),
  );
}

/**
 * Reply on a ticket. Resolves with the ticket and its full thread, so the
 * screen re-renders from the response rather than refetching.
 *
 * JSON body `{ message, imageUrl }`, like createTicket — an image is the base64
 * data URI, `null` when there is none.
 */
export function replyToTicket({ ticketNumber, message, image }) {
  return send(
    api.post(endpoints.support.ticketReply(ticketNumber), {
      message,
      imageUrl: imageDataUri(image) ?? null,
    }),
  );
}

/** Close a ticket. No body; resolves with the ticket and its thread. */
export function closeTicket(ticketNumber) {
  return send(api.put(endpoints.support.ticketClose(ticketNumber)));
}
