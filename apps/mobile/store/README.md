# Store publishing kit

Everything needed to publish Suro to the App Store and Google Play lives here.
Releases are **fully automated from `main`** — see [Per-release flow](#per-release-flow);
the files below are the source of truth CI pushes from. Layout:

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
6. Screenshots are pushed by fastlane `deliver` from `apple/screenshots/<locale>/`,
   but only when those files change in the release push (App Store Connect
   carries the previous version's screenshots over otherwise). To force a
   re-upload, run the **Mobile submit** workflow with `push_screenshots`.
7. Listing text is pushed by `eas metadata:push` from `store.config.json`
   (CI does this on every release; locally: `pnpm --filter mobile submit:ios:metadata`).
   The submit profile carries no ASC API key, so a local run authenticates with
   your Apple ID interactively; set `EXPO_APPLE_APP_SPECIFIC_PASSWORD` to skip
   the 2FA prompt.

### Google Play

1. Create the app in the Play Console (package `dev.clotet.suro`).
2. Create a service account with "Release manager" access
   ([EAS docs](https://docs.expo.dev/submit/android/)), download its JSON key
   to `../credentials/play-service-account.json` (gitignored).
3. The **first** AAB must be uploaded manually in the Console (Play
   requirement); later uploads go through fastlane (CI, or `pnpm --filter
   mobile submit:android:release` locally) and land straight on the
   **production** track at 100%.
4. Fill Data safety, content rating, app access (review credentials) and
   target audience from `declarations.md`.
5. The listing texts and `images/*` under `play/metadata/android/<locale>/` are
   pushed by CI whenever those files change on `main` (the `play_listing_push`
   job); no Console editing needed.

## Per-release flow

A release is a normal PR to `main`. Everything after the merge is CI.

1. Add the version's entry to `apps/web/CHANGELOG.md` (one section per locale)
   and bump the root `package.json` version to match. The pre-commit hook runs
   `changelog:generate`, which writes the Play `changelogs/default.txt` files and
   `store.config.json`'s `apple.version` + `releaseNotes`; CI fails if they drift.
2. Merge. On `main`, `mobile_release_gate` (version bump + matching CHANGELOG
   entry + native paths touched) triggers `reusable-mobile-release.yml`, which:
   - builds both binaries on EAS and waits for them;
   - **Android** → `fastlane android release`: AAB + release notes to the Play
     **production** track, full rollout;
   - **iOS** → `eas submit` (binary) → `eas metadata:push` (listing text) →
     `fastlane ios submit_for_review`: waits for Apple to finish processing the
     build, attaches it, uploads screenshots if they changed, and submits the
     version for review with `automatic_release` so it ships on approval.
3. `release_tag` tags the commit `v<version>` and publishes a GitHub release
   with the CHANGELOG entry as its notes.

Both stores still gate on **their** review; nothing else needs a console visit.

Checks and manual fallbacks:

```sh
# copy & screenshots still within store limits (also runs in CI):
node apps/mobile/store/check-metadata.mjs

# re-submit a commit that already built (transient store error), or force a
# screenshot re-upload: Actions -> "Mobile submit" -> commit sha + platform.
# ios_skip_upload=true when the binary already reached ASC and only the
# metadata push / review submission needs retrying — e.g. after the one App
# Store failure mode that needs a human: submitting while the previous version
# is still in review ("a review submission is already in progress"). Wait for
# it to clear (or cancel it in ASC), then re-run with ios_skip_upload.

# local equivalents (EAS local builds; commit first — EAS archives via git):
pnpm --filter mobile release:android   # build + fastlane android release
pnpm --filter mobile release:ios       # build + eas submit + metadata + submit for review
pnpm --filter mobile submit:android:metadata   # Play listing (CI does this on change)
pnpm --filter mobile submit:android:promote    # move a release between tracks
```

Versioning: the Android version code / iOS build number bump automatically
(`appVersionSource: "remote"`, `autoIncrement: true` in `eas.json`). The
user-facing `version` (versionName / "1.7.0") is derived in `app.config.ts`
from the monorepo root `package.json`, so it tracks each release on its own —
bump the root `package.json` version (in lockstep with the matching
`CHANGELOG.md` entry) and the store version follows. No need to touch
`app.json`.

`store.config.json`'s `apple.version` is plain JSON and can't read
`package.json`, so `changelog:generate` writes it (it tells EAS Metadata which
App Store version to push the listing to — without it the push sends an empty
`versionString` and fails). `check-metadata.mjs` fails if it drifts from the
root `package.json`.

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

Repeat the seed + capture pass per locale (`ca`, `es`, `en`), then normalize
and validate (normalization is a no-op when captures already come from the 6.9"
simulator, but it fixes wrong-device captures before commit):

```sh
uv run apps/mobile/store/generate-graphics.py   # resize apple/screenshots → 1320×2868
node apps/mobile/store/check-metadata.mjs       # prints which ASC display slot to use
```

### App Store Connect upload (iPhone screenshots)

CI uploads these via fastlane `deliver`, which picks the display class from the
image dimensions. The rest of this section only matters for a manual upload.

App Store Connect has separate upload areas per **display class**. A 1320×2868
file is valid only in **6.9-inch Display**; uploading it to **6.5-inch
Display** fails with:

> Screenshots dimensions should be: 1242 × 2688px, 2688 × 1242px, 1284 × 2778px
> or 2778 × 1284px

Path: version → App Previews and Screenshots → iPhone → **6.9-inch Display**
(use "View All Sizes in Media Manager" if the UI defaults to 6.5-inch). Upload
one locale folder per language tab in ASC (`ca`, `es-ES`, `en-US`).
