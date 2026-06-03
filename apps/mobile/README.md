# Suro mobile (Expo)

React Native app (Expo Router) for the Lists slice, backed by Convex.

## Run

1. Start the Convex backend and copy its URL:
   ```sh
   pnpm --filter backend dev        # prints CONVEX_URL
   ```
2. Point the app at it:
   ```sh
   cp apps/mobile/.env.example apps/mobile/.env
   # set EXPO_PUBLIC_CONVEX_URL=<your CONVEX_URL>
   ```
3. Run on a device/simulator:
   ```sh
   pnpm --filter mobile ios       # or: android
   ```

## Auth

Sign-in uses Convex Auth (Google OAuth + Resend magic-link), mirroring the web
app. The Convex **deployment** needs these env vars set (`npx convex env set …`):
`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_RESEND_KEY`, `AUTH_EMAIL_FROM`, and
the `JWT_PRIVATE_KEY` + `JWKS` pair (generate with `npx @convex-dev/auth`).
Native Google OAuth additionally needs the redirect wired to the `suro://` scheme.

## Notes

- **Styling**: built with React Native core + a small theme (`src/theme.ts`,
  `src/ui.tsx`) and native stack navigation, using the **Convergence** font (the
  web app's typeface). Tamagui v2 was attempted but has unresolved type/JSX
  incompatibilities with this Expo SDK (56) / React 19.2; it can be layered in
  on-device once that settles. The screens are deliberately thin so swapping the
  component layer is low-effort.
- **Data**: all reads/writes go through `backend`'s Convex functions via
  `useQuery`/`useMutation` (reactive — no offline/sync layer). The complete-item
  toggle uses a Convex optimistic update.

## Verified

`tsc --noEmit` passes and `expo export -p ios` bundles cleanly. On-device login
and live multi-device sync require a real Convex deployment (above) and have not
been exercised in CI.
