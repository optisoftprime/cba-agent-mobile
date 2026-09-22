# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Project conventions

## Files & routing
- **JSX/JS only** — no `.ts`/`.tsx`. `tsconfig.json` stays because Metro reads its `paths` for the `@/` alias.
- **Folder-based routing**: every route is `src/app/<name>/index.jsx`. The only flat files are the group defaults (`src/app/index.jsx`, `src/app/(tabs)/index.jsx`) — expo-router requires those.
- Navigate through `src/lib/navigate.js` (`navigateTo` / `navigateBack` / `navigateReplace` / `navigateReset`), never `router.*` or `<Link>` directly. It carries the double-tap guard and toasts errors instead of throwing.
- **Ending a process needs two things**, or the agent can walk back into it: `navigateReset(...)` on the screen's action (replace only swaps the top screen — the finished ones survive underneath), and `<NoGoingBack onBack={...} />` from `components/layout/no-going-back` in the screen body (blocks Android's hardware back AND iOS's edge swipe; `onBack` makes the device back button do what the screen's own button does, rather than nothing). It registers via `useFocusEffect`, NOT `useEffect` — a pushed-over screen stays mounted, and a plain effect would leave it swallowing the back button of whatever sits on top of it. Applied to `code-verified` and `deposit/success`. Any screen that consumes a one-time code or posts money needs both.
- A screen reached from another gets a back arrow via `showBack` on `SheetScreen` (it sits in the blue banner) or `MessageScreen`. A screen that ENDS a process gets neither.

## Persistence — one API
`src/lib/storage.js` exports `save` / `load` / `remove`, and nothing else touches AsyncStorage or SecureStore.
- `await save(StorageKeys.user, user)`, `await load(StorageKeys.user)`, `await remove(StorageKeys.a, StorageKeys.b)`.
- **Whether a key is secure is declared once, in `StorageKeys`** (`secure(...)` vs `plain(...)`). Call sites never choose a store, so a token can't end up in AsyncStorage by mistake.
- Secure: tokens, the user, the device id, in-flight activation. Plain: theme, language. Nothing about the agent is kept in plain storage — signing out leaves the login screen knowing nobody.
- Any JSON value round-trips; don't `JSON.stringify` at the call site. `save` never throws (resolves false); `load` resolves null.
- Anything that must survive the app being killed goes here — never React state or AppState alone.

## Session
`src/lib/session.js` owns the signed-in agent. `await getUser()` returns everything the login response carried (tokens included) plus `expiresAt`, or null. `saveSession(loginData)` after login, `applyProfile(...)` to fold in `GET /agent/profile`, `clearSession()` on sign-out. Screens read it through `useAuth().user`, and `src/lib/agent.js`'s `agentView(user)` maps it to what the agent-facing screens render (login and profile disagree on field names).

Whether a stored token is still good is answered by the SERVER (`GET /agent/profile`), never by reading an expiry off the device clock — the access token is an opaque UUID, not a JWT, so there is nothing to decode locally. Unreachable server ≠ signed out: the session is kept and the app opens.

The startup check also confirms the token belongs to the agent stored on THIS device (`identityChanged`): a token re-issued to someone else, or a handset passed on without a proper sign-out, would otherwise show one agent another's name, customers and collections. `agentCode` is the identity; email is only consulted when one side has no agentCode — comparing a stored agentCode against a returned email flags every response that omits the code as an impostor.

**Signing out removes EVERYTHING about the agent** — tokens, the stored agent, and any half-finished activation (keyed by agentCode, so it is theirs). It calls `POST /agent/auth/logout` FIRST so the token is revoked server-side rather than left alive until it expires, but the local wipe runs in a `finally`: a failed revoke, an offline phone, or anything else must never keep someone signed in. What survives is only what is not about the agent — `deviceId` and `deviceActivated` (the HANDSET's registered identity; wiping them would make the bank refuse deposits until re-activation, and signing out is not handing the phone back) and `themeMode`/`language`.

**A 401 ends the session.** The access token is opaque, so the server introspects it and a rejection is authoritative. Anything that is NOT a 401 (offline, server down) keeps the session — being unable to reach the server is not proof of being signed out.

**A 403 ends it too — every 403, no exceptions.** The live server refuses a suspended agent with `403 "Your agent access is suspended"` on every endpoint, and an unregistered handset with `403 "This device is not the one registered to your account"`. Neither is something the agent can resolve from inside the app, and leaving them there means every screen errors while the session looks fine — which is what QA hit.

Signing out costs nothing in either case, because the way back in is the login screen regardless: a suspended agent is refused by login itself (correct), and a device-reset agent logs in fine and is routed to Activate Device by `deviceActivationRequired`. Activation runs on `publicApi` and needs NO token, so having signed out never blocks it.

An earlier version tried to tell the two 403s apart by reading the message, because `errorCode` is a bare `ERR_403` for both. That was brittle and pointless once the answer is the same either way — don't reintroduce it.

When a 403 ends the session the agent sees the SERVER's words ("Your agent access is suspended"), not "session expired", which would send them to retype a password that is also going to be refused.

**`GET /agent/profile` returns 200 for a suspended agent** (verified), so the startup check cannot detect suspension on its own — the app opens normally and only finds out on the first dashboard call, which then signs them out. When the backend moves suspension to 401 it has to cover profile too.

The startup check is SILENT — `fetchAgentProfile({ silent: true })` passes `skipSessionExpiry`, so a rejected token clears the session and lands on login without a toast. The agent didn't ask for that check and shouldn't be told it happened. Only a 401 on a call the agent actually triggered raises "session expired".

## Backend
- **`src/config/backend.js` is the only place the server URL lives** (`BASE_URL` = `https://gateway.ezoneapps.com:30002/ezone-agent-service`). Keep the `/ezone-agent-service` prefix — the OpenAPI doc's auto-generated server URL omits it and 404s.
- Spec: `https://gateway.ezoneapps.com:30002/ezone-agent-service/v3/api-docs`. Take paths and bodies from it, not from guesses.
- API modules contain real calls only — no stubs, no fake responses. Where the backend has no endpoint yet (login, password reset), the placeholder lives in the screen/provider with a `TODO(backend)` marker, never inside `src/api/`.
- `src/api/client.js` has two clients. **`publicApi`** for calls that need no token (`resend-otp`, `verify-otp`, login): no token, and a 401 is just an error. Note `device-activation/activate` DOES need a signed-in token (live server: 401 "Sign in first") — it's on `publicApi` only until a login endpoint exists. **`api`** for everything else: sends the bearer token, and a 401 signs the user out via the handler the AuthProvider registers. Which client a call uses IS its auth policy — there is no path list.
- **Request bodies are trimmed in the interceptor**, every string, at every depth — so a form that forgets to trim can't send `" AGT-ORG-123 "` and earn a "does not match" nobody can explain. `password` is excluded: spaces can be part of a real password, and silently altering one turns a correct password into a failed login.
- Wrap calls in `send(...)`: it unwraps the `{ success, errorCode, message, data }` envelope, treats `success: false` as failure even on HTTP 200, and rejects with an `ApiError` whose `message` is safe to show.
- Paths live in `src/api/endpoints.js`, each starting `/api/v1`.
- Every call logs `apiAddress` / `apiPayload` / `apiResponse` / status / duration to the Metro console, toggled by `LOG_API` in `src/config/backend.js` (dev only by default). Passwords and tokens are redacted before printing — device logs reach crash reports and are readable on a rooted phone.

### Enums the server actually enforces
Taken from the server's own rejection messages, not the spec — send a wrong value and it names the valid set. Worth doing for every new filter, because the spec has been wrong before.
- Collections `type`: `[ALL, DEPOSIT, AJO]`; `period`: `[TODAY, WEEK, MONTH, ALL]`. An unknown value is a 400, not an empty list.
- Ticket `status`: `[OPEN, PENDING, CLOSED, RESOLVED, IN_PROGRESS]` — five, but the list endpoint only counts three of them (`open`, `inProgress`, `resolved`), so a PENDING or CLOSED ticket appears in the list under no tile. `src/lib/status.js` covers all five regardless.
- Unknown ids are readable 404s (`Collection not found`, `Ticket not found`), so `ErrorState` can show the server's message as-is.
- Paging is echoed back (`size=5` returns `size: 5`) and a page past the end is a 200 with no rows, never a 404 — `nextPageOf` stops on `totalPages`, so it never asks for one.
- Ajo `frequency`: `[DAILY, WEEKLY, MONTHLY]`. Creating a plan requires `customerCode`, `planName`, `frequency`, `contributionAmount`, `startDate` — `duration` is optional, but without it there is no `expectedTotal` or `maturityDate`. `maturityDate` and `expectedTotal` are computed server-side and must never be sent.
- Recording an Ajo contribution ALSO posts an Ajo_Contribution collection server-side, so it invalidates `collections` and `dashboard`, not just the plan.
- **`POST /agent/deposits` answers 401 for an unknown account number** (errorCode `ERR_401`, "The deposit could not be posted. Please try again."), with a token that is provably still valid before and after. In this app a 401 ENDS THE SESSION, so as it stands a typo'd account number signs the agent out. Until the backend fixes it, the deposit call must pass `skipSessionExpiry` — reported to the backend team.
- **Deposits need `X-Agent-Device-Id`** — the same deviceId sent at activation. Core banking compares it to the registered handset. Missing it: `403 "Send your device id with every request"`; a different one: `403 "This device is not the one registered to your account"`. Neither is a 401, so a wrong handset does NOT end the session, which is correct. The header is added by the `api` client interceptor on EVERY authenticated call, because the server's own message says to send it with every request — not remembered per call site.
- Deposit `clientReference` is the IDEMPOTENCY KEY: the server answers `duplicate: true` rather than taking the money twice. It is generated once when the review screen mounts (`newClientReference()`), never per tap — a fresh reference on a retry is a second deposit.
- Deposit `status` is `Posted` or `Pending`. `Posted` → `customerBalanceAfter` is the new balance. `Pending` → over the agent's cap, awaiting approval, `pendingReason` says why, and **the money has not landed** — the success screen must show the amber clock, not a tick.
- An EARLIER 401 from `POST /agent/deposits` on an unknown account was reported as a backend bug; it was the missing `X-Agent-Device-Id` header, which did not exist in the spec at the time. The endpoint now answers 403 correctly. What an unknown account returns WITH a valid device id is still unverified.
- **End of day** (`src/api/eod.js`, screen `src/app/eod/`): `expectedCash = settledCash + pendingIn − pendingOut`, `variance = countedCash − expectedCash`. `status` is `Balanced` (day closed, reconciliation hold lifted — no form shown) or `Variance` (day stays open, the agent may recount). `eodState(record)` is the ONE reading of that (`open`/`variance`/`closed`); `src/lib/variance.js` + `components/eod/variance-text` are the one wording/colour of a difference (short = danger, over = warning). `countedCash` 0 is valid; blank is not. History items live under `items`, not a named key. Every EOD call is device-bound (403 on any other handset), so it cannot be exercised from a script — verify on the registered phone.
- **Remittance** (`POST /agent/remittances`, screen `src/app/remittance/`) follows the deposit rules exactly — `clientReference` fixed on mount, `Posted` vs `Pending`, `duplicate` — via the shared `src/lib/cash-movement.js`. Amount min 0.01. It changes cash in hand and expected cash, so it invalidates `dashboard` and `eod`. Both are reached from the dashboard buttons under "Today's money"; the reconciliation-hold banner opens End of day, because a Balanced count is what lifts it.
- Password policy, from the server's own rejection: at least one upper case, one lower case, one number, one symbol, minimum 6. `src/lib/password.js` is the single copy of that rule — both screens that set a password use it.
- `password-reset/verify-otp` types `otp` as an **integer**, not a string, so it is sent as a number.
- `password-reset/request` answers 200 for an unregistered email exactly as for a real one, so the form cannot be used to discover which addresses have accounts. The screen keeps that property by advancing either way.
- **Changing the password does NOT revoke existing tokens** — tested: a token issued before the change still returned 200 afterwards. Reported to the backend team.
- `logout` revokes properly (the token then 401s), but calling it twice returns a message containing the raw token UUID. Reported — tokens should not appear in error strings, which get logged.

- **Creating a support ticket is NOT a JSON post.** `subject`, `description`, `categoryId` and `priority` are QUERY PARAMETERS; the body is `multipart/form-data` carrying only `image`. Sending the old JSON body silently loses the subject — the server no longer reads it from there. A body is mandatory: no body at all is a 500, so `createTicket` always sends the FormData even with no image (an empty multipart envelope is accepted). FormData passes through the request interceptor untouched because `trimDeep` only recurses plain objects.
- **Image upload is not configured on the current server**: attaching one returns `400 "Image upload is not configured on this environment"`. The app is built for it and will work the moment storage is switched on; until then the agent sees that message and can remove the image and resend. Reported to the backend team.

- **The backend issues ONE token per agent** — signing in again returns the SAME token, and `logout` revokes it everywhere. So signing out on any device signs the agent out on all of them, and a test logout will kill a session a real handset is holding. Verified by signing in twice and revoking one.

- Notifications `unreadOnly` is strictly boolean — `unreadOnly=maybe` is a 400, so `src/api/notifications.js` omits the param rather than sending a string.
- Notification `type` and `targetType` values have NOT been seen (this agent's inbox is empty), so `src/lib/notifications.js` matches them by keyword with a fallback bell and refuses to navigate on an unknown target. Tighten to exact values once real notifications exist.

## Toasts and finishing an operation
`import { toast } from '@/lib/toast'` → `toast.success(title, message)` / `toast.error(...)` / `toast.info(...)`. Never call `Toast.show` directly. Rendering and colours live in `components/layout/app-toast`.

**Every toast shows two lines** — a short heading (`text1`) and the detail under it (`text2`, a step smaller). A one-line toast reads like a system error, and the heading is what actually registers while it slides past. The API guarantees it: called with ONE argument, that argument is the **message**, not the heading, and the heading comes from the type. `toast.error(error.message)` is the commonest call in the app and a raw server string ("Invalid credentials") is detail — never a heading. So a lazy call still gets two lines instead of a sentence where a title belongs.

**A toast is for something passing. It is NOT how an operation ends.** Anything that finished — a deposit posted, a ticket raised — uses **`ui/success-modal`**: it blocks, it does not time out, the backdrop does nothing, and Android's back button does what the primary button does. A toast slides away on a timer and takes the reference number with it; the agent has to see the operation landed, read back what the server returned, and acknowledge it. Pass the server's own values through `details` (reference, new balance, status) rather than restating what was typed in. `tone="pending"` swaps the green tick for an amber clock — a deposit over the cap comes back `Pending`, which is a finished operation but not a completed one, and must not show a tick.

## Unlocking
**A fingerprint unlocks a session; it does not decide where that session may go.** `unlockWithBiometrics` resolves with the SESSION (or null), never a bare boolean, and the login screen sends it through the same `enterApp` gate as a password sign-in. It used to return `true`, which invited the caller to route everyone to the dashboard — and that is exactly how an agent whose device access had been reset by an administrator walked straight past the activation screen (BUG-086). The password path checked `deviceActivationRequired`; the fingerprint path did not.

`activate-device` is a GATE, not a step: no back arrow, and `<NoGoingBack>` sends the hardware back to login rather than into whatever screen was underneath. The loop is closed — login's fingerprint routes back to activation.

The fingerprint lives on the LOGIN screen, never the splash. The splash does the waiting and routes; it never asks the agent for anything. A valid session therefore lands on login, which greets them by name and offers the fingerprint — unlocking is a decision, and decisions belong on a screen the agent can act on.

Both the greeting and the fingerprint button hang off the same test — is there a stored session — so they can never disagree.

## Device activation (resumable)
Agent code + activation code → OTP sent → OTP verified. **The whole flow is keyed by `agentCode`** — `resend-otp` takes `{ agentCode }`, `verify-otp` takes `{ agentCode, otp }`, and responses carry `{ step, message, agentCode, sentTo }` where `sentTo` is a masked destination (`***3924`) for display only. There is no email anywhere in it. Progress is saved to secure storage the moment the code is accepted (`src/lib/activation.js`), and the splash screen resumes at the OTP screen if it finds it. Verifying clears it *before* navigating away, so a finished activation never resumes. The OTP screen reads everything from saved progress, never route params. `savePendingActivation` throws without an `agentCode`: a record missing it is unresumable, and silently writing one makes the OTP screen bounce back to the code screen, which looks like the screen refusing to advance. Code length/format and the resend cooldown are constants at the top of `src/lib/activation.js`.

## Full-screen chrome
**The bottom navigation bar is hidden; the status bar is NOT.** `<NavigationBar hidden />` in `src/app/_layout.jsx` plus the `expo-navigation-bar` plugin (`{ hidden: true }`), so it is already gone on the first frame rather than flashing in. `NavigationBar.setHidden(true)` runs again whenever the app returns to the foreground: Android puts the bar back after an edge swipe, the recents switcher or a permission dialog, and without that the app drifts back to looking windowed after a few minutes.

The status bar was hidden too for a while and it was wrong — an agent out on a round needs the time, the battery and the signal at a glance, and hiding it meant swiping down to check any of them. The bottom bar is dead space the app can use; the top bar is information. `<StatusBar style="light" />` stays, light because the banner behind it is the brand colour.

`setVisibilityAsync` is deprecated in SDK 57 — use `setHidden`, and the plugin option is `hidden`, not `visibility`.

The nav bar reappearing transiently on a swipe is Android's behaviour, not a bug. Safe-area insets still drive the layout (`AppHeader` and `bottom-nav-bar` read them), so a notch or a gesture pill is still respected — hiding the bar does not mean drawing under a cutout.

## Theming — one file
`src/theme/brand.js` is the ONLY place a colour is written down. Change it and the whole app follows.
- `tailwind.config.js` generates a class per token from that file; `ThemeProvider` publishes the active palette as CSS variables.
- In components: use the class (`bg-primary`, `text-ink-muted`, `border-line`, `bg-tile-1`).
- Only when a real colour is required (Ionicons `color`, `placeholderTextColor`, navigator options): `const { colors } = useTheme()`.
- Shadows live there too, as layers: `const { shadows } = useTheme()` then `style={shadows.md}`. They compile to RN 0.76+ `boxShadow` — do NOT use Tailwind `shadow-*` (fixed values, can't follow the palette) or bare `elevation` (Android-only, no colour).
- **Never write a hex value outside `src/theme/brand.js`.** `npm run check:theme` enforces light/dark parity for both colours and shadow levels.

## Language
- No user-facing string in a component. Add it to `src/i18n/locales/<lang>/<namespace>.json` and read it with `t('namespace.key')`.
- Locale files are auto-discovered — a new namespace is a new file, a new language is a new folder. Nothing to wire up.
- `npm run check:locales` fails if the languages drift apart **or if any `t('...')` in `src/` names a key that doesn't exist** — so a raw key can't reach the screen.
- i18next copies `resources` once at init, so a string added while Metro is running would otherwise render as a raw key until a restart. Three layers stop that reaching a screen, and all three exist because it happened repeatedly: `src/i18n/index.js` re-reads the locale files on a missing key (THROTTLED, never once-per-key — giving up after one try loses the race with the bundler), `module.hot.accept` re-applies them when a locale file changes, and `parseMissingKeyHandler` renders a humanised word rather than a dotted key path as a last resort. Never hand `addResourceBundle` a snapshot built at module load.
- **A raw key on screen is a bug in this file's wiring, not in the locale data** — `npm run check:locales` validates the files, so it passes while the running app is stale. Reload before assuming a key is missing.

## Components — three folders, that's it
- `components/ui/` — generic and reusable. Knows nothing about customers, loans or agents.
- `components/layout/` — app chrome: `app-header`, `bottom-nav-bar`, `auth-screen`.
- `components/<feature>/` — compositions only that feature uses (e.g. `dashboard/task-card`).

A component graduates from `<feature>/` to `ui/` the moment a second screen needs it.

Reach for these before building anything new:
- **`ui/list-card`** — THE row card. `leading` / `overline` / `title` (+`titleTone`) / `subtitle` / `meta` / `footer` / `status` / `trailing` / `align`. Every list in the app (customers, accounts, loans, tickets, collections, notifications, profile summary) is this one component with different slots filled. Do not write another card.
- `ui/detail-rows` — grouped label/value rows in one bordered card (the Overview pattern). A row's `value` may be a node, so a row can hold a `StatusPill`.
- `ui/filter-chips` — pill row, selected chip fills with the brand colour. Scrolls by default; `fill` shares the width for a small fixed set.
- `ui/segmented-tabs` — muted track, selected item raised as a white pill. The OTHER tab style; the designs use both, so don't merge them.
- `ui/balance-panel` — the dark emphasis panel (loan outstanding balance).
- `ui/confirm-dialog` — the last check before an irreversible action.
- `ui/date-field` — a date field shaped exactly like `select-field`, opening the platform's own picker (`@react-native-community/datetimepicker`, a NATIVE module — it needs a new dev build). It speaks plain `YYYY-MM-DD` and never exposes a Date: `toIsoDate`/`fromIsoDate` in `lib/format` work in LOCAL time, because `toISOString().slice(0,10)` sends "today" as the wrong day either side of Greenwich.
- **`ui/success-modal`** — THE end of a completed operation (see Toasts below). `title` / `message` / `details` rows / `primaryLabel` / optional `secondaryLabel` / `tone`. Like `confirm-dialog` and `select-field` it is styled from `colors`, not classes — a Modal renders into its own host tree, which the theme's CSS variables do not reach.
- `ui/scalloped-edge` — the torn-paper edge on the deposit receipt.
- `ui/section-heading` — takes `action` (any node, e.g. a `SelectPill`) or `actionLabel`.
- `ui/metric-panel` — tinted strip of 2–3 label/value pairs inside a card.
- `ui/stat-card` — `layout="stacked"` (dashboard tiles) or `"count"` (value over label, centred).
- **`ui/error-state`** — THE failure state. Every screen AND every tab that can fail uses it; `compact` inside a section. The icon and heading come from WHY it failed (`NETWORK` → no connection, `TIMEOUT` → took too long), with the server's own message underneath and a retry. Never a bare line of grey text with a plain button.
- `ui/copyable` — a copy affordance for a value the agent reads out or retypes. **Detail rows only** (`copyable: true` on a `ui/detail-rows` row), on the record's own screen — the customer's phone, a loan's ID. NOT on list rows: a list is for scanning and tapping, and an icon on every card is clutter. Confirms with the icon turning to a tick, never a toast.
- **`ui/empty-state`** — THE empty state. Every list that can come back empty uses it (icon + title + message); `compact` for an empty section inside a fuller screen. Never a bare line of grey text.
- `ui/skeleton` (+`SkeletonCard`) — loading placeholders shaped like the real content, so nothing moves when data lands. Screens show these, not spinners.
- **`ui/loading-more`** — THE next-page footer. `ListFooterComponent={<LoadingMore active={isFetchingNextPage} />}` on every infinite list, so "loading more" looks the same everywhere; it renders null when inactive, so it is passed unconditionally. It is NOT the first-page state — that's a skeleton. Do not inline another `ActivityIndicator` in a list footer.
- `ui/alert-banner` — an in-page condition the agent must read (reconciliation hold). Not a toast: a toast disappears.
- `ui/activity-list`, `ui/section-heading`, `ui/status-pill`, `ui/avatar`.
- **`ui/amount-field`** — THE money input. Groups digits as they are typed (`2000000` shows as `2,000,000`) while keeping `value` a plain numeric string, so callers still do `Number(value)` and nothing has to strip commas before sending. Never take a cash figure through a bare `TextField`: `2000000` and `200000` are one glance apart and ten times different, and this is a cash app.
- **`ui/resend-link`** — THE "didn't get a code? resend" control, used by BOTH OTP screens (device activation, password reset). It shows all three states: counting down (plain text, 60s from `resendSecondsLeft`), sending (a spinner beside a dimmed label, not pressable), and ready. The middle state is the point — the handler already refuses a second call so no duplicate code goes out, but a link that does not visibly react is a link the agent taps again and again, and being left wondering whether it worked is the failure.
- `ui/search-input`, `button` (`variant`: primary/secondary/outline/danger/ghost, plus `size` and `icon`), `text-field` (`multiline`), `select-field` (exports `SelectField` and the compact `SelectPill`), `password-field`, `otp-input`, `checkbox`, `controlled-field`, `link-text`.
- `ui/brand-logo` — mark + wordmark, both from `brand.js`.
- `layout/app-header` — the blue banner (`AppHeader`, `HeaderAction`, `HeaderAvatar`). `showBack` adds the back arrow; `overlap` leaves room for cards to pull up over it.
- `layout/bottom-nav-bar` — the tab bar. Tabs are declared in `src/app/(tabs)/_layout.jsx`.
- `layout/app-toast` — the themed toast host (mounted once in `AppProviders`).
- **`layout/keyboard-view`** — THE keyboard-avoiding wrapper. Every screen that takes typed input is inside one (`AuthScreen` and `SheetScreen` already are, so their screens get it free). NOT React Native's own `KeyboardAvoidingView`: from Expo SDK 54 Android runs edge-to-edge, the window is no longer resized when the keyboard opens, and the usual `behavior={Platform.OS === 'ios' ? 'padding' : undefined}` therefore does NOTHING on Android — fields just vanish behind the keyboard. This wraps `react-native-keyboard-controller`, which measures the keyboard itself on both platforms (a NATIVE module: it needs a new dev build, and `KeyboardProvider` is mounted in `AppProviders`). Always pair it with `keyboardShouldPersistTaps="handled"` on the scroller, or the first tap while the keyboard is up is swallowed dismissing it and the agent has to tap twice. A list whose search box is pinned ABOVE it (customers, loans) needs the persist-taps but not the avoidance — the input never moves.
- `layout/app-header` also exports **`NotificationsAction`** — the bell, wired to `/notifications`. It belongs on the DASHBOARD ONLY. Repeating it on every screen meant tapping it on the notifications screen navigated to the notifications screen, and it crowded headers that already had a back arrow. Don't add it elsewhere; don't hand-roll a `HeaderAction` for it.

## Screens and data
Screens fetch with TanStack Query. The query lives next to its call — `src/api/dashboard.js` exports `fetchDashboard()` and `dashboardQuery` ({ queryKey, queryFn }) — so the key is defined once and the screen just spreads it into `useQuery`.

Every screen handles four states: **pending** (a skeleton shaped like the content), **error** (the server's message plus a retry), **empty** (`ui/empty-state`), and data. Pull-to-refresh via `RefreshControl` where the screen scrolls.

**Every list is infinite-scrolled** — `useInfiniteQuery` + `onEndReached`, never a "load more" button and never one unbounded fetch. The paginated envelope is identical across this backend (`{ totalElements, totalPages, page, size, <items> }`), so `src/api/pagination.js` carries the shared parts: `nextPageOf` (getNextPageParam), `itemsOf(data, key)` to flatten, `totalOf` for the server's count. A list screen supplies the endpoint and the item key, nothing more.

**The one exception is Ajo**: `GET /agent/ajo` takes no `page`/`size` and answers with every plan in a plain array, so `src/app/ajo/index.jsx` uses `useQuery` and a plain `FlatList`. If the backend ever pages it, move it onto `useInfiniteQuery` like the rest.

On the infinite-scroll rule proper: `PAGE_SIZE` is **30**, every page including the first: the server defaults to 20, and on a tall handset 20 rows can stop just short of the fold — a list that doesn't overflow never fires `onEndReached`, so it looks like there is no more data.

Search that the server implements is sent server-side and debounced with `useDebounced` — otherwise every keystroke is a request, and slow replies can land out of order and show results for a prefix of what was typed.

**The query cache is cleared on every entry point** — sign-in, biometric unlock, and sign-out (`queryClient.clear()` in the auth provider). Whatever is cached belongs to the previous session, so the first screen after signing in must never show the last agent's figures.

## Data
**`src/api/mock.js` is gone.** Every screen now reads a real endpoint; it was deleted when the deposit flow became the last consumer and was wired up. Never reintroduce placeholder data in `src/api/` — where the backend has no endpoint yet, the stub lives in the screen behind a `TODO(backend)` marker.

Status → pill tone maps live in `src/lib/status.js`, one per entity. Never inline one in a screen.

The theme's CSS variables do not cross into a React Native `<Modal>`'s host tree — style that subtree from `useTheme().colors` instead of classes (see `ui/select-field`).

Do NOT use i18next plural suffixes (`key_one` / `key_other`) — that lookup needs `Intl.PluralRules`, which Hermes doesn't reliably have, and it renders the raw key on device. Pick singular/plural in JS from two plain keys.

Multi-step flows (deposit) carry state forward in route params via `navigateTo(path, params)` and read it with `useLocalSearchParams()` — no flow-wide store.

Run `npm run check` (theme + locales + lint) before calling a change done.
