# CBA Agent App

React Native (Expo SDK 57) app for CBA agents. Screens are placeholders until the Figma is ready —
the foundation (routing, styling, API layer, auth session, providers) is in place.

## Getting started

```bash
npm install
# point the app at a server: set BASE_URL in src/config/backend.js
npm start              # then press a / i / w, or scan the QR with Expo Go
```

## Scripts

| Command             | What it does                        |
| ------------------- | ----------------------------------- |
| `npm start`         | Start the Metro dev server          |
| `npm run android`   | Start and open on Android           |
| `npm run ios`       | Start and open on iOS (macOS only)  |
| `npm run web`       | Start and open in the browser       |
| `npm run lint`      | ESLint (expo config)                |
| `npm run typecheck` | `tsc --noEmit`                      |
| `npm run format`    | Prettier + Tailwind class sorting   |
| `npm run doctor`    | `expo-doctor` dependency health     |

## Structure

```
src/
  app/                 expo-router routes (file-based)
    _layout.tsx        root layout — providers + stack
    index.tsx          entry: redirects to (auth) or (tabs)
    (auth)/login.tsx   auth group
    (tabs)/            main tab group (home, profile)
    +not-found.tsx
  api/
    client.ts          axios instance, auth header, error helper
    endpoints.ts       API paths in one place
  components/ui/       Button, TextField, Screen
  constants/theme.ts   colors, spacing, fonts
  hooks/               useColorScheme, useTheme
  lib/storage.ts       SecureStore wrapper (AsyncStorage on web)
  providers/           AppProviders (query, safe area, toast), AuthProvider
  types/               shared types
```

## Styling

NativeWind v4 (Tailwind class names on RN components) — matches the Tailwind setup used in the web
projects. Design tokens live in `tailwind.config.js`; the `brand` color scale there is a placeholder
to be replaced with the Figma values.

```tsx
<View className="flex-1 items-center justify-center bg-white">
  <Text className="text-lg font-semibold text-brand-500">Hello</Text>
</View>
```

## Data & auth

- `@tanstack/react-query` for server state (`AppProviders` sets up the client).
- `axios` instance in `src/api/client.ts` attaches the bearer token from SecureStore.
- `AuthProvider` (`src/providers/auth-provider.tsx`) restores the session on launch and exposes
  `signIn` / `signOut`. The 401-refresh path is a TODO pending the real auth endpoints.
- Forms: `react-hook-form` + `zod` via `@hookform/resolvers`.
