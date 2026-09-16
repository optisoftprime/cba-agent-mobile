/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THE backend file. Point the app at a server from here — nowhere else.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * BASE_URL is the gateway host plus the service's gateway prefix. Every route
 * in src/api/endpoints.js starts with /api/v1 and is appended to it:
 *
 *   https://gateway.ezoneapps.com:30002/ezone-agent-service  +  /api/v1/device-activation/activate
 *
 * Note: the service's own OpenAPI doc lists its server as the bare host with
 * no /ezone-agent-service — that entry is auto-generated and wrong behind the
 * gateway (the bare host returns 404). Keep the prefix.
 *
 * API docs: https://gateway.ezoneapps.com:30002/ezone-agent-service/v3/api-docs
 */
export const BASE_URL = 'https://gateway.ezoneapps.com:30002/ezone-agent-service';

/** Give up on a request after this long; the user sees a "timed out" toast. */
export const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Log every request and response to the Metro console — address, payload,
 * status, body, duration. Development only by default; set it to `true` to
 * keep it on in a release build while chasing something.
 *
 * Passwords and tokens are replaced with [redacted] before anything is
 * printed (see src/api/client.js). Device logs are readable by other apps on
 * a rooted phone and end up in crash reports, so a password must never reach
 * one — everything else is shown in full so a payload can be checked against
 * the API docs.
 */
export const LOG_API = __DEV__;
