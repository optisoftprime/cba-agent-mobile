# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Project conventions

## Files & routing
- **JSX/JS only** — no `.ts`/`.tsx`. `tsconfig.json` stays because Metro reads its `paths` for the `@/` alias.
- **Folder-based routing**: every route is `src/app/<name>/index.jsx`. The only flat files are the group defaults (`src/app/index.jsx`, `src/app/(tabs)/index.jsx`) — expo-router requires those.
- Navigate through `src/lib/navigate.js` (`navigateTo` / `navigateBack` / `navigateReplace`), never `router.push` directly. It carries the double-tap guard and toasts errors instead of throwing.

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
- `npm run check:locales` fails if the languages drift apart.

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
- `ui/scalloped-edge` — the torn-paper edge on the deposit receipt.
- `ui/section-heading` — takes `action` (any node, e.g. a `SelectPill`) or `actionLabel`.
- `ui/metric-panel` — tinted strip of 2–3 label/value pairs inside a card.
- `ui/stat-card` — `layout="stacked"` (dashboard tiles) or `"count"` (value over label, centred).
- `ui/activity-list`, `ui/section-heading`, `ui/status-pill`, `ui/avatar`, `ui/empty-state`.
- `ui/search-input`, `button` (`variant`: primary/secondary/outline/danger/ghost, plus `size` and `icon`), `text-field` (`multiline`), `select-field` (exports `SelectField` and the compact `SelectPill`), `password-field`, `otp-input`, `checkbox`, `controlled-field`, `link-text`.
- `ui/brand-logo` — mark + wordmark, both from `brand.js`.
- `layout/app-header` — the blue banner (`AppHeader`, `HeaderAction`, `HeaderAvatar`). `showBack` adds the back arrow; `overlap` leaves room for cards to pull up over it.
- `layout/bottom-nav-bar` — the tab bar. Tabs are declared in `src/app/(tabs)/_layout.jsx`.
- `layout/app-header` also exports **`NotificationsAction`** — the bell every screen carries, already wired to `/notifications`. Use it rather than hand-rolling a `HeaderAction`.

## Data
Placeholder data lives in `src/api/mock.js` behind `getAgent()` / `getCustomers()` / `getCustomerById()` / `getLoans()` / `getLoanById()` / `getAccountById()` / `getTickets()` / `getTicketCounts()` / `getPaymentMethods()`. Screens call those, so swapping in the real endpoint changes only that file. Never hardcode a list inside a screen. Loans are stored on the customer and flattened by `getLoans()`, so a list and a detail screen can't disagree.

Status → pill tone maps live in `src/lib/status.js`, one per entity. Never inline one in a screen.

The theme's CSS variables do not cross into a React Native `<Modal>`'s host tree — style that subtree from `useTheme().colors` instead of classes (see `ui/select-field`).

Do NOT use i18next plural suffixes (`key_one` / `key_other`) — that lookup needs `Intl.PluralRules`, which Hermes doesn't reliably have, and it renders the raw key on device. Pick singular/plural in JS from two plain keys.

Multi-step flows (deposit) carry state forward in route params via `navigateTo(path, params)` and read it with `useLocalSearchParams()` — no flow-wide store.

Run `npm run check` (theme + locales + lint) before calling a change done.
