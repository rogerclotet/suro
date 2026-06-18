# AGENTS.md

Suro is a shared-corkboard app for groups (flatmates, family, friends): lists, calendar, files, notes, and expenses. UI is localized in `ca`, `es`, `en`.

It's a pnpm monorepo:

- `packages/backend` — the **Convex** backend (schema, queries/mutations, auth, file storage, the `.ics` feed). The single source of truth and the shared API for both clients.
- `apps/web` — the Next.js App Router PWA (the main focus of this file).
- `apps/mobile` — the Expo (React Native) app.

Both clients talk to the same Convex deployment. There is no separate server or database.

## Stack

- **Backend**: Convex (`packages/backend/convex`), Convex Auth (`@convex-dev/auth`: Google + Apple OAuth + Resend email OTP; Apple stays hidden client-side until its env vars are set), Convex file storage. Schema in `convex/schema.ts`.
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
| Lint + format check / fix | `pnpm biome:check` / `pnpm biome:fix` |
| Typecheck (all workspaces) | `pnpm typecheck` |

After edits run `pnpm biome:fix && pnpm typecheck && pnpm test`. The Husky pre-commit hook runs the same gate across all workspaces — don't bypass it with `--no-verify`. Never apply Biome's **unsafe** fixes (`biome check --write --unsafe`); they can change behavior.

## Backend (`packages/backend/convex`)

- `schema.ts` — the tables (`users`, `projects`, `projectMembers`, `categories`, `events`, `lists`, `listItems`, `listTemplates`, `files`, `notes`, `pots`, `potMembers`, `spendings`). Migrated rows carry a `legacyId` + `by_legacyId` index (dropped after cutover).
- `auth.ts` / `auth.config.ts` — Convex Auth (Google + Apple + Resend OTP); `afterUserCreatedOrUpdated` provisions the personal project on sign-up. `oauthProviders` tells the clients which optional providers are configured.
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
- No manual codegen needed — `src/data/changelog.generated.ts` is regenerated from `CHANGELOG.md` by the `pre*` hooks (`predev`/`prebuild`/`pretest`/`pretypecheck`). Run `pnpm changelog:generate` to preview.

## Git

Remote is **GitLab** (`gitlab.com/rogerclotet/suro`), not GitHub. Use `glab mr create --target-branch main` to open merge requests — `gh` won't work here.

## Deploys

Data, auth, and storage all run on **Convex** — the web container is just the Next server (`node server.js`), with no migrate/seed step at start.

- **Convex backend**: pushes to `main` run the `convex_deploy` CI job (`packages/backend` → `npx convex deploy`, authed by the `CONVEX_DEPLOY_KEY` CI variable). It runs **before** the web deploy (`deploy` `needs: [build, convex_deploy]`) so the new frontend always lands on an up-to-date backend. The Convex deployment's own env (Google/Apple/Resend/JWT, plus `MIGRATION_SECRET` during cutover) is set on Convex via `convex env set --prod`, not in CI. Two of those vars govern the web domains: `SITE_URL` (canonical origin for OAuth redirects and email/calendar links — set to `https://suroapp.cat`) and `ALLOWED_WEB_ORIGINS` (comma-separated allowlist of origins valid as OAuth redirect targets — set to `https://suroapp.cat,https://suro.clotet.dev,https://*.suro.clotet.dev` so login works on both domains and on previews).
- **Prod web**: `apps/web/scripts/deploy.sh` SSHes into the host, pulls the CI-built image, and runs it via `docker compose` (root `compose.yaml`) as the `familia` container on the shared `familia-previews` network. Pangolin/Traefik reaches it by name at `http://familia:3000`; the deploy no longer writes any proxy config (routing is a one-time Pangolin setup — see below). The image bakes `NEXT_PUBLIC_CONVEX_URL` (prod) at build time. Manage it from SSH with bare `docker compose` commands (`ps`, `logs -f`, `pull && up -d`) — see the header of `compose.yaml`.
- **MR previews**: `scripts/deploy-preview.sh` boots `suro-mr-<iid>` at `https://mr-<iid>.<PREVIEW_DOMAIN>`, built against `NEXT_PUBLIC_CONVEX_URL_PREVIEW` so **all previews share the dev Convex deployment** — no per-MR database. Merging/closing the MR (or 1-week idle) triggers `scripts/teardown-preview.sh`.
- **Mobile builds**: deliberately **not in CI** (runner build times were prohibitive). Build locally via the `build:*` scripts in `apps/mobile` — `pnpm --filter mobile build:android:preview` (dev-Convex `.apk`), `build:android:release` (store-ready `.aab`), `build:ios:release` (store-ready `.ipa`, pending Apple Developer credentials). Signing uses EAS-managed credentials (`eas login` once); public build env (`EXPO_PUBLIC_*`) is baked per profile in `apps/mobile/eas.json`. Store publishing (EAS Submit profiles, listing metadata for both stores, screenshots, console declarations) lives in `apps/mobile/store/` — see `apps/mobile/store/README.md`. See `apps/mobile/README.md` for build prerequisites.

CI variables to set: `CONVEX_DEPLOY_KEY` (prod deploy key), `NEXT_PUBLIC_CONVEX_URL` (prod), `NEXT_PUBLIC_CONVEX_URL_PREVIEW` (dev), plus the existing PostHog + registry/SSH vars.

### Host prerequisites (one-time)

The deploy host must have:

- **Pangolin/Traefik** already running (cert resolver `letsencrypt`).
- **A shared Docker network** Traefik can reach — `familia-previews` by default. Create it and join Pangolin's `gerbil` (Traefik shares gerbil's network namespace) so it resolves containers by name:
  ```sh
  docker network create familia-previews
  docker network connect familia-previews gerbil
  ```
- **Prod routing for both domains** → `http://familia:3000`. Either (recommended) add a Pangolin dashboard *resource* for `suro.clotet.dev` and one for `suroapp.cat`, both targeting `http://familia:3000`; or use Traefik's file provider by copying the ready-made route into the watched dir: `cp deploy/traefik/familia.yml "$TRAEFIK_ROUTES_DIR/familia.yml"`.
  - The file provider also drives MR previews. To enable it: in `/srv/pangolin/config/traefik/traefik_config.yml` change `filename: /etc/traefik/dynamic_config.yml` to `directory: /etc/traefik/routes/` with `watch: true`, then `mkdir -p /srv/pangolin/config/traefik/routes`, move any existing `dynamic_config.yml` into it, and `docker compose -f /srv/pangolin/docker-compose.yml restart traefik`.
- **DNS + TLS**: `suroapp.cat` → server IP (Traefik fetches its cert on demand via `letsencrypt`), plus the existing wildcard `*.suro.clotet.dev` → server IP with a DNS-01 wildcard cert (still used by previews).
- **`$SSH_PROJECT_DIRECTORY`** exists on the host. The deploy `scp`s `compose.yaml` there on every run, so you don't manage it by hand — but for a manual first deploy, copy `compose.yaml` there yourself. Prod needs no other host config (if host port 3000 is already taken, add a `.env` there with `WEB_PORT=<free port>`). For MR previews only, also add `deploy.env` there (gitignored — copy from `deploy.env.example`). The web container talks only to Convex — no Postgres or per-MR database.

## Don't

- Don't commit `.env`. Update `.env.example` **and** `src/env.js` together when adding a web var; backend secrets go on the Convex deployment via `convex env set`, not in the web env.
- Don't bypass Husky hooks, and never apply Biome's unsafe fixes.
- Don't introduce a second package manager, formatter, or test runner.
- Don't reintroduce Postgres/Drizzle/NextAuth/REST or read project data without the server-side membership gate — the app is Convex-only.
