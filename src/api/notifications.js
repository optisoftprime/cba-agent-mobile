import { api, send } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { nextPageOf, PAGE_SIZE } from '@/api/pagination';

/**
 * Agent Notifications — /api/v1/agent/notifications.
 *
 * The inbox comes back newest first, and `unreadCount` rides along on every
 * page for the bell badge, so the list and the badge are one request. Like the
 * collections tiles, it is read from page 0.
 *
 * `unreadOnly` is strictly boolean on the server — `unreadOnly=maybe` is a 400,
 * not a shrug — so it is only sent when true rather than as a string.
 */

function fetchNotifications({ unreadOnly = false, page = 0, size = PAGE_SIZE }) {
  return send(
    api.get(endpoints.notifications.list, {
      params: { unreadOnly: unreadOnly ? true : undefined, page, size },
    }),
  );
}

/**
 * The inbox as an infinite query:
 * { unreadCount, totalElements, totalPages, page, size,
 *   notifications: [{ reference, type, title, body, targetType, targetId, read, createdAt }] }
 */
export const notificationsQuery = ({ unreadOnly = false } = {}) => ({
  queryKey: ['notifications', { unreadOnly }],
  queryFn: ({ pageParam = 0 }) => fetchNotifications({ unreadOnly, page: pageParam }),
  initialPageParam: 0,
  getNextPageParam: nextPageOf,
});

/** The badge number, off page 0. */
export function unreadCountOf(data) {
  return data?.pages?.[0]?.unreadCount ?? 0;
}

/** Mark one read. Idempotent per the spec, so a double tap is harmless. */
export function markNotificationRead(reference) {
  return send(api.post(endpoints.notifications.read(reference)));
}

/** Mark the whole inbox read. */
export function markAllNotificationsRead() {
  return send(api.post(endpoints.notifications.readAll));
}
