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
 * Raise a ticket. The reporter comes from the token; only `subject` is required.
 *
 * The endpoint takes the fields TWO different ways, and which one it reads
 * depends on the body:
 *
 * - **No image → JSON body** `{ subject, description, categoryId, priority }`.
 *   This is the important case, and the one that used to fail: an EMPTY
 *   FormData is sent by React Native WITHOUT a multipart boundary, and the
 *   request then never completes — the app showed "no internet". Verified
 *   against the live server: a plain JSON body is accepted (the fields are read
 *   from it), so the no-image path avoids multipart entirely.
 *
 * - **With image → multipart**, fields as QUERY params and the image as the one
 *   form part. The form is non-empty here, so RN sets the boundary correctly
 *   (the interceptor strips the Content-Type so RN can). Image storage is off
 *   on the current environment, so this still 400s "image could not be stored"
 *   until the backend enables it — the agent can drop the image and send text.
 */
export function createTicket({ subject, description, categoryId, priority, image }) {
  if (!image?.uri) {
    return send(
      api.post(endpoints.support.tickets, {
        subject,
        description: description || undefined,
        categoryId: categoryId ?? undefined,
        priority: priority || undefined,
      }),
    );
  }

  const form = new FormData();
  form.append('image', {
    uri: image.uri,
    name: image.name || 'attachment.jpg',
    type: image.type || 'image/jpeg',
  });

  return send(
    api.post(endpoints.support.tickets, form, {
      params: {
        subject,
        description: description || undefined,
        categoryId: categoryId ?? undefined,
        priority: priority || undefined,
      },
    }),
  );
}

/**
 * Reply on a ticket. Resolves with the ticket and its full thread, so the
 * screen re-renders from the response rather than refetching.
 *
 * A plain message goes as JSON; a message WITH an image goes multipart (the
 * server reads `message` and `image` from the form). Image upload is not
 * configured on the current environment yet — it 400s with a readable message,
 * the same as creating a ticket with an attachment — so the agent can drop the
 * image and resend text only.
 */
export function replyToTicket({ ticketNumber, message, image }) {
  if (image?.uri) {
    const form = new FormData();
    form.append('message', message ?? '');
    form.append('image', {
      uri: image.uri,
      name: image.name || 'attachment.jpg',
      type: image.type || 'image/jpeg',
    });
    // The interceptor strips Content-Type off the FormData so RN adds the
    // multipart boundary — see createTicket.
    return send(api.post(endpoints.support.ticketReply(ticketNumber), form));
  }

  return send(api.post(endpoints.support.ticketReply(ticketNumber), { message, imageUrl: null }));
}

/** Close a ticket. No body; resolves with the ticket and its thread. */
export function closeTicket(ticketNumber) {
  return send(api.put(endpoints.support.ticketClose(ticketNumber)));
}
