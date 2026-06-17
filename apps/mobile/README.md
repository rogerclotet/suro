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

## Builds (local)

Client builds run locally — runner build times made CI builds impractical. All
three scripts are EAS **local** builds signed with the EAS-managed credentials;
log in once with `eas login` (eas-cli is a devDependency, so the scripts
resolve it from the workspace).

| Script (`pnpm --filter mobile …`) | Profile (`eas.json`) | Output |
| --- | --- | --- |
| `build:android:preview` | `preview` (dev Convex) | `build/suro-preview.apk` (sideload-able) |
| `build:android:release` | `production` | `build/suro-release.aab` (store-ready) |
| `build:ios:release` | `production` | `build/suro-release.ipa` (store-ready) |

Prerequisites:

- **Android**: JDK 17 + the Android SDK (`ANDROID_HOME`). The keystore lives
  on EAS (created via `eas credentials -p android`); the build fetches it.
- **iOS**: Xcode, fastlane and CocoaPods, plus an Apple Developer Program
  membership with distribution credentials on EAS (`eas credentials -p ios`
  for `dev.clotet.suro`) — configured, so `build:ios:release` fetches them.

Notes:

- EAS archives the project **via git**, so uncommitted changes are not part of
  the build — commit first.
- Production builds bake `EXPO_PUBLIC_CONVEX_URL`/`EXPO_PUBLIC_SITE_URL` from
  the `production` profile's `env` in `eas.json` and auto-increment the remote
  version (`appVersionSource: "remote"`). Store submission + listing metadata:
  see `store/README.md` (EAS Submit profiles in `eas.json`, App Store text via
  EAS Metadata, Play listing under `store/play/`).

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
- **Push notifications**: delivery runs through the Expo Push API → APNs (iOS) /
  FCM (Android). The client registers in `src/lib/push.ts` (`usePushNotifications`,
  mounted in the authed `(app)/_layout.tsx`); the backend sends from
  `packages/backend/convex/push.ts`, localized per recipient with a deep-link
  `data.path`. APNs key + FCM V1 key live on EAS (`eas credentials`); Android
  also needs `google-services.json` (committed, referenced from `app.json`).
  Push is a no-op in Expo Go and on simulators — test on a dev/release build on a
  physical device.

## Verified

`tsc --noEmit` passes and `expo export -p ios` bundles cleanly. On-device login
and live multi-device sync require a real Convex deployment (above) and have not
been exercised in CI.
