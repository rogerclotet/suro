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

## Git

Remote is **GitLab** (`gitlab.com/rogerclotet/suro`), not GitHub. Use `glab mr create --target-branch main` to open merge requests — `gh` won't work here.

## Deploys

- **Prod**: pushes to `main` run `scripts/deploy.sh`, which SSHes into the host, pulls, rebuilds the `familia` image, and restarts the container behind Traefik (`$PROD_DOMAIN`).
- **MR previews**: every MR pipeline runs `scripts/deploy-preview.sh`, which boots `suro-mr-<iid>` against its own Postgres DB (`suro_mr_<iid>`) at `https://mr-<iid>.preview.suro.app`. Merging/closing the MR (or 1-week idle) triggers `scripts/teardown-preview.sh`.
- Migrations run at container start via `scripts/entrypoint.sh` → `scripts/migrate.mjs`, against the runtime `DATABASE_URL` — so previews migrate into their own DB.

### Host prerequisites (one-time)

The deploy host must have:

- **Traefik** running with the Docker provider, attached to a shared network (`$PREVIEW_DOCKER_NETWORK`, e.g. `web`), with a Let's Encrypt resolver named `letsencrypt`.
- Wildcard DNS `*.preview.suro.app` → server IP, and a wildcard TLS cert (DNS-01) covering it.
- Postgres reachable from inside containers on `$PREVIEW_DOCKER_NETWORK`; a CI user with `CREATEDB` privilege.
- `/etc/suro/preview.env` with shared preview env (Resend, Uploadthing dev keys, VAPID, `AUTH_SECRET`, etc.). Google OAuth is **not** wired for previews — wildcard redirect URIs aren't allowed; use Resend magic-link sign-in.
- `deploy.env` at the project root (gitignored) — copy from `deploy.env.example` and fill in values. Sourced by all deploy scripts over SSH.

## Don't

- Don't commit `.env`. Update `.env.example` **and** `src/env.js` together when adding a var.
- Don't bypass Husky hooks.
- Don't introduce a second package manager, formatter, or test runner.
