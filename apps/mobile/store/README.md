# Store publishing kit

Everything needed to publish Suro to the App Store and Google Play lives here,
so a release is mostly mechanical. Layout:

```
store.config.json            EAS Metadata (App Store listing text, ../)
store/
  README.md                  this runbook
  declarations.md            console questionnaire answers + review notes
  check-metadata.mjs         lints text limits + image dimensions
  generate-graphics.py       regenerates Play icon + feature graphics
  apple/screenshots/<loc>/   committed App Store screenshots (1320x2868)
  play/metadata/android/     Play listing in fastlane-supply layout
    <loc>/{title,short_description,full_description}.txt
    <loc>/changelogs/default.txt
    <loc>/images/{featureGraphic.png,phoneScreenshots/}
```

Locales everywhere: `en-US`, `es-ES`, `ca` (both stores support Catalan).
EAS Metadata only supports the App Store (and no screenshot upload), which is
why the Play listing is plain files in fastlane-supply layout, pushed by the
fastlane lanes (`metadata_path: store/play/metadata/android` — the directory
that directly holds the locale folders).

## One-time setup

### fastlane (both stores)

`bundle install` once (installs fastlane, pinned in `Gemfile.lock`). Submission
and store metadata run through fastlane lanes (`fastlane/Fastfile`); EAS only
builds the binaries. Android reuses the Play service-account key below; iOS lanes
use the App Store Connect API key (`APP_STORE_CONNECT_API_KEY_*` in a gitignored
`fastlane/.env`).

### Apple

1. Apple Developer Program membership + iOS distribution/APNs credentials on
   EAS (`pnpm exec eas credentials -p ios` for `dev.clotet.suro`) — **done**.
2. Create the app in App Store Connect (bundle id `dev.clotet.suro`, name
   "Suro", default locale Catalan).
3. The numeric App Store Connect app id is set in `submit.production.ios.ascAppId`
   in `../eas.json`.
4. Set the review demo account env vars on the **prod** Convex deployment and
   mirror them into `apple.review.demo*` in `store.config.json` locally (don't
   commit the real code) — see `declarations.md` → Review notes.
5. Fill the App Privacy labels + age rating from `declarations.md`.
6. Upload screenshots from `apple/screenshots/<locale>/` (ASC → version →
   App Previews and Screenshots; EAS Metadata does not push images).
7. Push the listing text with `pnpm --filter mobile submit:ios:metadata`
   (`eas metadata:push`, sourced from `store.config.json`). The submit profile
   carries no ASC API key, so the first run authenticates with your Apple ID
   interactively (App Store Connect access required); set
   `EXPO_APPLE_APP_SPECIFIC_PASSWORD` to skip the 2FA prompt on later runs.

### Google Play

1. Create the app in the Play Console (package `dev.clotet.suro`).
2. Create a service account with "Release manager" access
   ([EAS docs](https://docs.expo.dev/submit/android/)), download its JSON key
   to `../credentials/play-service-account.json` (gitignored).
3. The **first** AAB must be uploaded manually in the Console (Play
   requirement); later uploads go through fastlane (`pnpm --filter mobile
   submit:android:release`).
4. Fill Data safety, content rating, app access (review credentials) and
   target audience from `declarations.md`.
5. Paste the listing texts and upload `images/*` from
   `play/metadata/android/<locale>/` (Main store listing → add the three
   languages).

## Per-release flow

```sh
# 0. copy & screenshots still accurate? lints lengths + dimensions:
node apps/mobile/store/check-metadata.mjs

# 1. release notes:
#    - add the new version entry to apps/web/CHANGELOG.md (per locale).
#      `submit:ios:metadata` and `submit:android:release` run
#      `pnpm changelog:generate` automatically first, regenerating Play
#      store/play/metadata/android/<locale>/changelogs/default.txt (≤500 chars)
#      and App Store store.config.json -> apple.info.<locale>.releaseNotes
#      (≤4000 chars) from the latest entry. Pre-commit also stages the
#      generated store files when CHANGELOG.md is committed; CI fails if they drift.

# 2. build (EAS local builds; commit first — EAS archives via git)
pnpm --filter mobile build:android:release   # build/suro-release.aab
pnpm --filter mobile build:ios:release       # build/suro-release.ipa

# 3. submit (fastlane uploads the binary + release notes). build + submit in one:
pnpm --filter mobile release:android    # = build:android:release, then fastlane android release
pnpm --filter mobile release:ios        # = build:ios:release, then fastlane ios release

# 4. Play/App Store listing changed (text, images, screenshots)? push it explicitly:
pnpm --filter mobile submit:android:metadata
pnpm --filter mobile submit:ios:metadata   # `eas metadata:push` from store.config.json
#    (iOS screenshots are not pushed by EAS Metadata — upload them manually in ASC)

# 5. promote internal -> production when ready:
pnpm --filter mobile submit:android:promote   # defaults to production (or use the Console)
#    iOS: submit for review in App Store Connect.
```

Versioning: the Android version code / iOS build number bump automatically
(`appVersionSource: "remote"`, `autoIncrement: true` in `eas.json`). The
user-facing `version` (versionName / "1.7.0") is derived in `app.config.ts`
from the monorepo root `package.json`, so it tracks each release on its own —
bump the root `package.json` version (in lockstep with the matching
`CHANGELOG.md` entry) and the store version follows. No need to touch
`app.json`.

One exception: `store.config.json`'s `apple.version` is plain JSON and can't
read `package.json`, so bump it to the same value each release — it tells EAS
Metadata which App Store version to write the listing to (without it, the push
sends an empty `versionString` and fails before a build exists).
`check-metadata.mjs` fails if it drifts from the root `package.json`.

## Screenshot capture

Committed screenshots are captured from the real app with seeded demo data —
6 per platform per locale: home dashboard, lists overview, list detail,
calendar month, expenses pot, notes. Naming: `01-home.png` … `06-notes.png`
(order = store order; supply uploads alphabetically).

Prep (once per capture session):

1. Run the dev backend (`pnpm --filter backend dev`) and point the app at it
   (`apps/mobile/.env`).
2. Set `AUTH_REVIEW_EMAIL` + `AUTH_REVIEW_OTP` on that deployment
   (`npx convex env set AUTH_REVIEW_EMAIL review@suro.clotet.dev` …).
3. Sign in once in the app with the review email + fixed code.
4. Stage content for the pass's locale (also switches the account's UI
   locale):
   `npx convex run seed:demoGroup '{"email": "review@suro.clotet.dev", "locale": "ca"}'`

iOS — needs a native build (NativeTabs don't render in Expo Go); the
6.9" simulator produces store-ready 1320x2868 PNGs directly:

```sh
pnpm --filter mobile exec npx expo run:ios --device "iPhone 17 Pro Max"
xcrun simctl status_bar booted override --time "9:41" --batteryState charged --batteryLevel 100
xcrun simctl io booted screenshot apps/mobile/store/apple/screenshots/ca/01-home.png
```

Android — Pixel 9 AVD (1080x2424; reuse a running emulator if there is one):

```sh
pnpm --filter mobile android   # builds + installs on the running AVD
adb shell settings put global sysui_demo_allowed 1
adb shell am broadcast -a com.android.systemui.demo -e command enter
adb shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm 0941
adb shell am broadcast -a com.android.systemui.demo -e command battery -e level 100 -e plugged false
adb exec-out screencap -p > apps/mobile/store/play/metadata/android/ca/images/phoneScreenshots/01-home.png
adb shell am broadcast -a com.android.systemui.demo -e command exit
```

Repeat the seed + capture pass per locale (`ca`, `es`, `en`), then validate:

```sh
node apps/mobile/store/check-metadata.mjs
```
