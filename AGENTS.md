# AGENTS.md

Suro is a shared-corkboard app for groups (flatmates, family, friends): lists, calendar, files, notes, and expenses. UI is localized in `ca`, `es`, `en`.

It's a pnpm monorepo:

- `packages/backend` — the **Convex** backend (schema, queries/mutations, auth, file storage, the `.ics` feed). The single source of truth and the shared API for every client.
- `apps/web` — the Next.js App Router PWA (the main focus of this file).
- `apps/mobile` — the Expo (React Native) app.
- `apps/wear` — the Wear OS companion (Kotlin + Compose). A **standalone Gradle build**, deliberately outside the pnpm workspace, so `pnpm -r test` never triggers an Android build; CI reaches it through its own path-gated job.

All three clients talk to the same Convex deployment. There is no separate server or database.

## Stack

- **Backend**: Convex (`packages/backend/convex`), Convex Auth (`@convex-dev/auth`: Google + Apple + Resend email OTP; iOS uses native Sign in with Apple, web/Android the Apple OAuth flow which stays hidden until its env vars are set), Convex file storage. Schema in `convex/schema.ts`.
- **Web**: Next.js 16 App Router, React 19, TypeScript (strict), Tailwind v4, next-intl (`[locale]` routing).
- **Data flow**: reactive Convex (`useQuery`/`useMutation`) in client components; `fetchQuery`/`preloadQuery` in RSC. No ORM, no REST layer.
- **UI/state**: Radix UI + Tiptap (rich text), React Hook Form + Valibot/Zod, Zustand.
- **Tooling**: pnpm workspaces, Biome (format + lint), Vitest (jsdom for web, `convex-test` for backend), Husky + lint-staged.
- **Analytics**: PostHog (product analytics + error tracking).

Removed in the Convex cutover: Drizzle/Postgres, NextAuth, React Query, Uploadthing, Web Push, the Dexie offline layer. Secret Santa and in-app notifications are temporarily disabled, to be rebuilt on Convex.

## Commands

Run from the repo root; most are workspace-filtered.

| Task | Command |
| --- | --- |
| Web dev server | `pnpm dev` (= `pnpm --filter web dev`) |
| Web build / start | `pnpm build` / `pnpm start` |
| Convex dev (watch + codegen) | `pnpm --filter backend dev` |
| Convex codegen (regen `api`/`dataModel`) | `pnpm --filter backend codegen` |
| Convex deploy | `pnpm --filter backend exec convex deploy` |
| Tests (all workspaces / one) | `pnpm test` / `pnpm --filter web test` |
| Mobile builds (local, EAS) | `pnpm --filter mobile build:android:release` / `build:android:preview` / `build:ios:release` |
| Wear OS tests / debug build | `cd apps/wear && ./gradlew :app:testDebugUnitTest` / `:app:assembleDebug` |
| Wear OS on-device tests | `cd apps/wear && ./gradlew :app:connectedDebugAndroidTest` (needs a booted Wear AVD) |
| Regenerate design tokens (CSS + Wear colors) | `pnpm --filter design-tokens generate` |
| Lint + format check / fix | `pnpm biome:check` / `pnpm biome:fix` |
| Typecheck (all workspaces) | `pnpm typecheck` |

After edits run `pnpm biome:fix && pnpm typecheck && pnpm test`. The Husky pre-commit hook runs the same gate across all workspaces — don't bypass it with `--no-verify`. Never apply Biome's **unsafe** fixes (`biome check --write --unsafe`); they can change behavior.

## Backend (`packages/backend/convex`)

- `schema.ts` — the tables (`users`, `projects`, `projectMembers`, `categories`, `events`, `lists`, `listItems`, `listTemplates`, `files`, `notes`, `pots`, `potMembers`, `spendings`). Migrated rows carry a `legacyId` + `by_legacyId` index (dropped after cutover).
- `auth.ts` / `auth.config.ts` — Convex Auth (Google + Apple + Resend OTP); `afterUserCreatedOrUpdated` provisions the personal project on sign-up. `oauthProviders` tells the clients which optional providers are configured. `AppleNative.ts` is the iOS native Sign in with Apple provider (verifies the `expo-apple-authentication` identity token; the web redirect flow can't run in the app because Safari drops the OAuth state cookie on Apple's cross-site POST).
- One file per domain (`lists.ts`, `events.ts`, `expenses.ts`, `files.ts`, `projects.ts`, `users.ts`, …) exporting public `query`/`mutation` functions — these **are** the API. Shared helpers live under `convex/model/` (`auth` → `requireUserId`, `permissions` → `requireProjectMember`, …); gate every project-scoped function with one of them.
- `http.ts` — the public `.ics` calendar feed, gated by `projects.calendarToken` (distinct from `inviteToken`).
- `migrations.ts` — one-off Postgres→Convex upserts driven by `scripts/migrate.mjs`, gated by the `MIGRATION_SECRET` deployment env var (remove this file + `legacyId` after cutover).
- After changing a function signature or the schema, run `pnpm --filter backend codegen` so the clients' generated `api`/`dataModel` types update. Never hand-edit `convex/_generated/`.

## Web layout (`apps/web/src/`)

- `app/[locale]/…` — App Router pages (the i18n segment is required). `app/api/` has only `health` now.
- `app/_data/*` — stable view types fed by `adaptX()` from Convex query results, so components consume one shape and the id-space stays consistent.
- `lib/queries/*` — reactive hooks (`useProjectLists`, `useEvent`, `useEventFiles`, …) wrapping `useQuery` + the adapters.
- `lib/convex/server.ts` — RSC helpers: `getAuthToken`, `fetchMe`, server-side `fetchQuery`.
- `auth.ts` — `auth()` = cached `fetchMe()` → `toSession()`. `lib/session.ts` — the client `useSession()` shim over `useConvexAuth()` + `useMe()`.
- `proxy.ts` — Next middleware composing `convexAuthNextjsMiddleware` with next-intl locale handling.
- `providers/convex-client-provider.tsx` — the `ConvexReactClient` + `ConvexAuthNextjsProvider`. `app/_components/projects-provider/` populates the Zustand project store from `api.projects.listMineDetailed` (skipped while signed out).
- `components/` — shared UI; Radix primitives in `components/ui/`. `env.js` — env validated via `@t3-oss/env-nextjs` (now just `NEXT_PUBLIC_CONVEX_URL` + PostHog).

## Wear OS (`apps/wear`)

Kotlin + Compose for Wear OS, covering the three things worth doing from a wrist: ticking list items off, seeing upcoming events (and ticking off an event's linked list), and viewing/adding expenses.

- **Pairing, not sign-in.** A watch has no usable keyboard, so it never authenticates on its own. The phone app mints a one-time ticket (`watchPairings.createTicket`) and writes it to the Wear Data Layer via the local Expo module in `apps/mobile/modules/suro-wear`; the watch redeems it through the `watch-pairing` Convex Auth provider (`convex/WatchPairing.ts`) for a **session of its own**. It must be a separate session: Convex Auth refresh tokens are single-use and rotate, so sharing the phone's would sign the phone out. The path strings are duplicated in `WearDataLayer.kt` (watch) and `WearPaths.kt` (phone) — change both.
- **The Data Layer only bridges apps signed with the same certificate.** A Play-installed phone app will not talk to a locally-built watch app. Locally this bites too: React Native's template ships its own `android/app/debug.keystore`, which is *not* AGP's default `~/.android/debug.keystore`, so `apps/wear/app/build.gradle.kts` points the watch's debug signing at the phone's keystore. It only exists after `expo prebuild`, so **prebuild the phone app before building the watch** — the build warns when it can't find it, because the symptom otherwise is a silent no-op.
- **No reactive client.** The watch calls Convex's HTTP API (`/api/query`, `/api/mutation`, `/api/action`) over OkHttp and fetches on demand — on screen open, on resume once data is stale, after its own writes, and via the Refresh row. No websocket, no Rust `.so`; the release APK is ~3 MB. The tradeoff is that a phone-side change isn't visible on an already-open watch screen until the next fetch.
- **Thin-client mutations.** `listItems.update` is non-sticky (it wipes any task field the caller omits), so the watch uses `listItems.setCompleted` instead. Add a narrow mutation rather than making the watch echo fields it never rendered.
- Colors come from `packages/design-tokens` via `scripts/generate-wear-colors.ts` — **never hand-edit `ui/theme/Color.kt`**. Strings are hand-ported into `res/values{,-ca,-es}/strings.xml` (the watch shows a smaller, differently-worded subset than the phone).
- Testing on an emulator: `system-images;android-34;android-wear;arm64-v8a` on Apple Silicon, `avdmanager create avd -d wearos_large_round`. `./gradlew :app:connectedDebugAndroidTest` runs the on-device auth tests (EncryptedSharedPreferences needs a real KeyStore). Pairing two emulators additionally needs the Wear OS companion app and a Google sign-in on the phone AVD, so a capture/QA run injects the session instead — see the Wear OS section of `apps/mobile/store/README.md`.
- Store screenshots: `uv run apps/mobile/store/capture-wear-screenshots.py <locale>` drives a booted Wear AVD through the real app into `play/metadata/android/<locale>/images/wearScreenshots/`. Play will not publish the Wear form factor without at least one.
- Same `applicationId` as the phone app so both ship in one Play listing under the Wear OS form factor; versionCodes must not collide, so the watch derives its code as `1_000_000 + major*10_000 + minor*100 + patch` from the root `package.json` version.

## Conventions

- Import alias `@/*` → `apps/web/src/*`; never relative `../../`. Clients import Convex types from `backend/convex/_generated/{api,dataModel}`; cast string ids `as Id<"table">` at call sites.
- Reads are reactive `useQuery` in client components; use `fetchQuery`/`preloadQuery` only where SSR matters. Gate any query that fires for signed-out users with `"skip"` until `useConvexAuth().isAuthenticated`.
- Project-scoped access is enforced **server-side** in the Convex function (`requireProjectMember`); don't reimplement auth in the client.
- Schema/field changes go in `packages/backend/convex/schema.ts` (+ `codegen`).
- Tests are colocated next to the code under test. All user-facing strings go through next-intl; new routes under `app/[locale]/`.

## Changelog

`CHANGELOG.md` (repo root) is the curated, user-facing changelog — **not** a full history. With every commit, update it **only if** the change is an important fix or a user-facing change (new feature, visible behavior change, notable bugfix). Skip it for refactors, internal/infra changes, dependency bumps, tests, or docs.

When an entry is warranted:

- Add a typed bullet in **all three** locales (`ca`, `es`, `en`) — the build fails if a type or locale is malformed. Format: `- [feature|fix|improvement] <text>`.
- No em dashes (`—`) in entry text; use commas, colons, or separate sentences instead. (The `## [x.y.z] — date` heading separator is fine.)
- **Never** append to an existing version block. Always start a **new** `## [x.y.z] — YYYY-MM-DD` block at the top (newest first) and bump `package.json` `version` to match. Use a **patch** bump for minimal changes or a lone fix; use a **minor** bump otherwise. The topmost version is shown in-app and drives the "app updated" toast, so the version bump is what notifies users.
- **Bump `apps/mobile/store.config.json` `apple.version` in lockstep** with the root `package.json` version. It's plain JSON and can't read `package.json`, so forgetting it lets the two drift. EAS Metadata writes the App Store listing to whichever version `apple.version` names, so a stale value targets the wrong/old App Store version on the next iOS metadata push. The always-run CI `repo_quality_checks` job runs `pnpm check:metadata`, which fails the pipeline on a mismatch — so a forgotten bump shows up as a red pipeline rather than a silent miss.
- No manual codegen needed — `src/data/changelog.generated.ts` is regenerated from `CHANGELOG.md` by the `pre*` hooks (`predev`/`prebuild`/`pretest`/`pretypecheck`). Run `pnpm changelog:generate` to preview.

## Git

Remote is **GitHub** (`github.com/rogerclotet/suro`). Use `gh pr create --base main` to open pull requests.

## Deploys

Data, auth, and storage all run on **Convex** — the web container is just the Next server (`node server.js`), with no migrate/seed step at start.

CI jobs are **path-gated** (`.github/workflows/ci.yml`, shared `.github/actions/detect-path-changes`): each build runs only when files affecting it change — web image/`web_deploy_production` on `apps/web` + `packages/backend` + root config; `backend_convex_deploy` on `packages/backend`; native mobile builds on `apps/mobile` + `packages/backend`. `repo_quality_checks` (lint/typecheck/test) always runs and gates production deploys and mobile releases; the Next.js compile-check is split into `web_pr_build`, run only on web-affecting PRs.

- **Convex backend**: pushes to `main` run the `backend_convex_deploy` CI job (`packages/backend` → `npx convex deploy`, authed by the `CONVEX_DEPLOY_KEY` CI variable). It runs **before** the web deploy (`web_deploy_production` hard-needs `web_docker_build_push` and optionally-needs `backend_convex_deploy`) so the new frontend always lands on an up-to-date backend. The Convex deployment's own env (Google/Apple/Resend/JWT, plus `MIGRATION_SECRET` during cutover) is set on Convex via `convex env set --prod`, not in CI. Two of those vars govern the web domains: `SITE_URL` (canonical origin for OAuth redirects and email/calendar links — set to `https://suroapp.cat`) and `ALLOWED_WEB_ORIGINS` (comma-separated allowlist of origins valid as OAuth redirect targets — set to `https://suroapp.cat,https://suro.clotet.dev,https://*.suro.clotet.dev` so login works on both domains and on previews).
- **Prod web**: `apps/web/scripts/deploy.sh` SSHes into the host, pulls the CI-built image, and runs it via `docker compose` (root `compose.yaml`) as the `familia` container on the shared `familia-previews` network. Pangolin/Traefik reaches it by name at `http://familia:3000`; the deploy no longer writes any proxy config (routing is a one-time Pangolin setup — see below). The image bakes `NEXT_PUBLIC_CONVEX_URL` (prod) at build time. Manage it from SSH with bare `docker compose` commands (`ps`, `logs -f`, `pull && up -d`) — see the header of `compose.yaml`.
- **MR previews**: `scripts/deploy-preview.sh` boots `suro-mr-<iid>` at `https://mr-<iid>.<PREVIEW_DOMAIN>`, built against `NEXT_PUBLIC_CONVEX_URL_PREVIEW` so **all previews share the dev Convex deployment** — no per-MR database. Trigger a deploy from the PR itself (easiest): add the `deploy-preview` label, comment `/deploy-preview`, or push while the label is on (auto-redeploy). From a local checkout: `./scripts/trigger-preview-deploy.sh` (uses the current branch's PR). Fallback: Actions → **Preview deploy** → PR number (branch selection is ignored). Removing the `deploy-preview` label or merging a PR that still has it auto-runs **Preview teardown**; manual fallback: Actions → **Preview teardown** → PR number.
- **Mobile builds**: on `main`, native-code changes trigger **EAS cloud builds** in CI (`mobile_eas_build_android` / `mobile_eas_build_ios`) in parallel — they build on Expo's infra (no Android/iOS toolchain on the runner), wait for each build to finish, download the store-ready `.aab`/`.ipa`, and then `mobile_play_store_submit` / `mobile_app_store_submit` ship those binaries to the stores automatically (fastlane for Android, EAS Submit for iOS). A separate **Mobile submit** workflow remains for manual re-submission of a specific commit. The `production` profile auto-increments the remote version on every build, so each native-affecting merge bumps the build number. You can still build locally via the `build:*` scripts in `apps/mobile` — `pnpm --filter mobile build:android:preview` (dev-Convex `.apk`), `build:android:release` (store-ready `.aab`), `build:ios:release` (store-ready `.ipa`). Signing uses EAS-managed credentials (`eas login` / `EXPO_TOKEN`); public build env (`EXPO_PUBLIC_*`) is baked per profile in `apps/mobile/eas.json`. Store publishing (EAS Submit profiles, listing metadata for both stores, screenshots, console declarations) lives in `apps/mobile/store/` — see `apps/mobile/store/README.md`. See `apps/mobile/README.md` for build prerequisites.

CI secrets to set (Settings → Secrets and variables → Actions): `CONVEX_DEPLOY_KEY` (prod deploy key), `NEXT_PUBLIC_CONVEX_URL` (prod), `NEXT_PUBLIC_CONVEX_URL_PREVIEW` (dev), `GHCR_PULL_TOKEN` (PAT with `read:packages` for production/preview deploy pulls), plus the existing PostHog + SSH vars. Mobile CI adds: `EXPO_TOKEN` (EAS access token), `PLAY_SERVICE_ACCOUNT_JSON` (the Play service-account key JSON), and `APP_STORE_CONNECT_API_KEY_KEY_ID` / `_ISSUER_ID` / `_KEY` (the last is the base64 `.p8`) for the iOS submit lane. Docker images are pushed to `ghcr.io/rogerclotet/suro` (uses the built-in `GITHUB_TOKEN`).

### Host prerequisites (one-time)

The deploy host must have:

- **Pangolin/Traefik** already running (cert resolver `letsencrypt`).
- **A shared Docker network** Traefik can reach — `familia-previews` by default. Create it and join Pangolin's `gerbil` (Traefik shares gerbil's network namespace) so it resolves containers by name:
  ```sh
  docker network create familia-previews
  docker network connect familia-previews gerbil
  ```
- **Prod routing for both domains.** Point Pangolin at the app either way: a Pangolin **local site** → `172.17.0.1:$WEB_PORT` (the host publish — the app must bind the bridge gateway, which `compose.yaml` does by default via `WEB_BIND`; matches the other services on this host); or straight to `http://familia:3000` over the shared network (a dashboard resource, or the file provider: `cp deploy/traefik/familia.yml "$TRAEFIK_ROUTES_DIR/familia.yml"`). Add a resource/route for **both** `suro.clotet.dev` and `suroapp.cat`.
  - The file provider also drives MR previews. To enable it: in `/srv/pangolin/config/traefik/traefik_config.yml` change `filename: /etc/traefik/dynamic_config.yml` to `directory: /etc/traefik/routes/` with `watch: true`, then `mkdir -p /srv/pangolin/config/traefik/routes`, move any existing `dynamic_config.yml` into it, and `docker compose -f /srv/pangolin/docker-compose.yml restart traefik`.
- **DNS + TLS**: `suroapp.cat` → server IP (Traefik fetches its cert on demand via `letsencrypt`), plus the existing wildcard `*.suro.clotet.dev` → server IP with a DNS-01 wildcard cert (still used by previews).
- **`$SSH_PROJECT_DIRECTORY`** exists on the host. The deploy `scp`s `compose.yaml` there on every run, so you don't manage it by hand — but for a manual first deploy, copy `compose.yaml` there yourself. Prod needs no other host config (set `WEB_PORT` / `WEB_BIND` in a `.env` there to control the host publish; it defaults to `172.17.0.1:3000`). For MR previews only, also add `deploy.env` there (gitignored — copy from `deploy.env.example`). The web container talks only to Convex — no Postgres or per-MR database.

## Don't

- Don't commit `.env`. Update `.env.example` **and** `src/env.js` together when adding a web var; backend secrets go on the Convex deployment via `convex env set`, not in the web env.
- Don't bypass Husky hooks, and never apply Biome's unsafe fixes.
- Don't introduce a second package manager, formatter, or test runner.
- Don't reintroduce Postgres/Drizzle/NextAuth/REST or read project data without the server-side membership gate — the app is Convex-only.
