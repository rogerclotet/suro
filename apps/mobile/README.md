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

## Builds (CI)

Pushes to `main` that touch `apps/mobile/`, `packages/backend/`, the lockfile,
or the CI config trigger three jobs (`.gitlab-ci.yml`):

| Job | Profile (`eas.json`) | Where | Artifact |
| --- | --- | --- | --- |
| `build_mobile_android_preview` | `preview` (dev Convex) | runner, `eas build --local` | `suro-preview.apk` (sideload-able) |
| `build_mobile_android_release` | `production` | runner, `eas build --local` | `suro-release.aab` (store-ready) |
| `build_mobile_ios_release` | `production` | EAS cloud | `suro-release.ipa` (store-ready) — **commented out** pending Apple credentials |

Production builds bake `EXPO_PUBLIC_CONVEX_URL`/`EXPO_PUBLIC_SITE_URL` from the
`production` profile's `env` in `eas.json` — the EAS local-build sandbox does
not inherit CI job env, so public build env belongs there, not in CI variables.
Release versioning is remote (`appVersionSource: "remote"` + `autoIncrement`),
so version codes bump on EAS servers per build. No `eas submit` step yet.

One-time setup before the first green run:

1. Create an access token on expo.dev and set it as the `EXPO_TOKEN` GitLab
   CI/CD variable (protected + masked). CI fetches signing credentials with it
   but can never create them (`--non-interactive`).
2. Android keystore: `cd apps/mobile && eas credentials -p android` →
   `production` → generate a new EAS-managed keystore.
3. iOS: requires an Apple Developer Program membership. Run
   `eas credentials -p ios` and create the distribution certificate + App Store
   provisioning profile for `app.suro.mobile`, then uncomment
   `build_mobile_ios_release` in `.gitlab-ci.yml`.

To force the mobile jobs without a mobile change, start a pipeline on `main`
from the GitLab UI ("Run pipeline") — they appear there as manual jobs.

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
