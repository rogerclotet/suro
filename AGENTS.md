# AGENTS.md

Suro is a Next.js + React 19 shared-corkboard app for groups (flatmates, family, friends): lists, calendar, files, notes, expenses, Secret Santa. UI is localized in `ca`, `es`, `en`.

## Stack

- Next.js App Router, TypeScript (strict), Tailwind v4
- pnpm, Biome (format + lint), Vitest (jsdom), Husky + lint-staged
- Drizzle ORM on Postgres, NextAuth v5 (Google + Resend email)
- React Query, React Hook Form + Zod/Valibot, Zustand, Radix UI, Tiptap
- PostHog, Web Push (VAPID), Uploadthing, Dexie (offline)

## Commands

| Task | Command |
| --- | --- |
| Dev server | `pnpm dev` |
| Build / start | `pnpm build` / `pnpm start` |
| Tests (one-shot / watch) | `pnpm test` / `pnpm test:watch` |
| Lint + format check / fix | `pnpm biome:check` / `pnpm biome:fix` |
| Typecheck | `pnpm typecheck` |
| Drizzle | `pnpm db:generate` / `db:migrate` / `db:push` / `db:studio` |
| Local Postgres container | `./start-database.sh` |

After edits, run `pnpm biome:fix && pnpm typecheck && pnpm test`. The Husky pre-commit hook runs the same gate — don't bypass it with `--no-verify`.

## Layout (`src/`)

- `app/[locale]/…` — App Router pages (i18n segment is required). `app/api/…` route handlers.
- `server/` — server actions and domain logic. Wrap auth-requiring actions with the helper in `src/server/action-auth.ts` instead of re-checking the session.
- `server/db/` — Drizzle schema (modular files under `schema/`). The connection in `server/db/index.ts` is cached in dev to survive HMR.
- `lib/` — utilities: auth-redirect, offline (Dexie), posthog, sanitization, revalidation helpers.
- `components/` — shared React UI. Radix-based primitives live in `components/ui/`.
- `hooks/`, `providers/`, `i18n/`, `styles/`.
- `auth.ts`, `auth.config.ts` — NextAuth v5 with the Drizzle adapter.
- `env.js` — env vars validated via `@t3-oss/env-nextjs` + Zod, split into server/client. Add new vars here and copy `.env.example` → `.env` for local dev.

## Conventions

- Import alias `@/*` → `./src/*`. Always use it; never relative `../../`.
- Project-scoped data goes through the `projectToUsers` join — don't read user-owned rows without a membership check.
- Tests are colocated next to the code under test (e.g. `notification-digests.test.ts` beside the module).
- Schema changes: edit the relevant file under `src/server/db/schema/`, then run `pnpm db:generate` to produce a new migration in `drizzle/`. Don't hand-edit existing migrations.
- All user-facing strings go through next-intl. New routes go under `app/[locale]/`.

## Changelog

`CHANGELOG.md` (repo root) is the curated, user-facing changelog — **not** a full history. With every commit, update it **only if** the change is an important fix or a user-facing change (new feature, visible behavior change, notable bugfix). Skip it for refactors, internal/infra changes, dependency bumps, tests, or docs.

When an entry is warranted:

- Add a typed bullet in **all three** locales (`ca`, `es`, `en`) — the build fails if a type or locale is malformed. Format: `- [feature|fix|improvement] <text>`.
- **Never** append to an existing version block. Always start a **new** `## [x.y.z] — YYYY-MM-DD` block at the top (newest first) and bump `package.json` `version` to match. Use a **patch** bump for minimal changes or a lone fix; use a **minor** bump otherwise. The topmost version is shown in-app and drives the "app updated" toast, so the version bump is what notifies users.
- No manual codegen needed — `src/data/changelog.generated.ts` is regenerated from `CHANGELOG.md` by the `pre*` hooks (`predev`/`prebuild`/`pretest`/`pretypecheck`). Run `pnpm changelog:generate` to preview.

## Git

Remote is **GitLab** (`gitlab.com/rogerclotet/suro`), not GitHub. Use `glab mr create --target-branch main` to open merge requests — `gh` won't work here.

## Deploys

Data, auth, and storage all run on **Convex** — the web container is now just the Next server (`node server.js`), with no migrate/seed step at start.

- **Convex backend**: pushes to `main` run the `convex_deploy` CI job (`packages/backend` → `npx convex deploy`, authed by the `CONVEX_DEPLOY_KEY` CI variable). It runs **before** the web deploy (`deploy` `needs: [build, convex_deploy]`) so the new frontend always lands on an up-to-date backend. The Convex deployment's own env (Google/Resend/JWT/`SITE_URL`, plus `MIGRATION_SECRET` during cutover) is set on Convex via `convex env set`, not in CI.
- **Prod web**: `scripts/deploy.sh` SSHes into the host, pulls the image built by CI, and restarts the `familia` container behind Traefik (`$PROD_DOMAIN`). The image bakes `NEXT_PUBLIC_CONVEX_URL` (prod) at build time.
- **MR previews**: `scripts/deploy-preview.sh` boots `suro-mr-<iid>` at `https://mr-<iid>.<PREVIEW_DOMAIN>`, built against `NEXT_PUBLIC_CONVEX_URL_PREVIEW` so **all previews share the dev Convex deployment** — no per-MR database. Merging/closing the MR (or 1-week idle) triggers `scripts/teardown-preview.sh`.

CI variables to set: `CONVEX_DEPLOY_KEY` (prod deploy key), `NEXT_PUBLIC_CONVEX_URL` (prod), `NEXT_PUBLIC_CONVEX_URL_PREVIEW` (dev), plus the existing PostHog + registry/SSH vars.

### Host prerequisites (one-time)

The deploy host must have:

- **Pangolin/Traefik** already running (uses the `pangolin` Docker network, cert resolver `letsencrypt`). Routing uses Traefik's **file provider** — no Docker provider needed.
  - One-time: change the file provider in `/srv/pangolin/config/traefik/traefik_config.yml` from `filename: /etc/traefik/dynamic_config.yml` to `directory: /etc/traefik/routes/` with `watch: true`, then `mkdir /srv/pangolin/config/traefik/routes && mv /srv/pangolin/config/traefik/dynamic_config.yml /srv/pangolin/config/traefik/routes/` and `docker compose -f /srv/pangolin/docker-compose.yml restart traefik`.
- Wildcard DNS `*.preview.suro.app` → server IP, and a wildcard TLS cert (DNS-01) covering it.
- `deploy.env` at the project root (gitignored) — copy from `deploy.env.example` and fill in values. Sourced by all deploy scripts over SSH. (No Postgres or per-MR database needed anymore; the web container talks only to Convex.)

## Don't

- Don't commit `.env`. Update `.env.example` **and** `src/env.js` together when adding a var.
- Don't bypass Husky hooks.
- Don't introduce a second package manager, formatter, or test runner.
