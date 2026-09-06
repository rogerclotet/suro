# Suro

A shared corkboard for the people you do life with. Suro keeps your group's lists, calendar, files, notes, shared expenses in one place. Built for flatmates, family and friend groups.

## What's inside

- **Lists**: shopping, packing, to-dos. Categorize items, save reusable templates, check things off together in real time.
- **Calendar**: shared events with the option to link a list to an event (so the packing list lives next to the trip).
- **Files & notes**: share photos, PDFs and rich-text notes with the whole group.
- **Expenses**: track who paid for what, split fairly, and let Suro suggest the simplest way to settle up.
- **Notifications**: in-app and push, only when something actually changes in your group.

The interface is available in Catalan, Spanish and English.

## Development

This is a pnpm monorepo. `packages/backend` owns the Convex API, auth and storage; `apps/web` is the Next.js PWA and `apps/mobile` is the Expo app. `packages/domain` contains shared pure rules and `packages/design-tokens` contains shared styling values. Secret Santa is currently disabled.

```sh
pnpm install
pnpm --filter backend dev
```

In another terminal, copy `apps/web/.env.example` to `apps/web/.env` and fill in the Convex deployment URL and PostHog settings, then run `pnpm dev`. Auth provider credentials and JWT keys belong in the Convex deployment environment, not the web `.env`.

For mobile setup and local builds, see [apps/mobile/README.md](apps/mobile/README.md).

After edits:

```sh
pnpm biome:fix
pnpm typecheck
pnpm test
```

Run `pnpm --filter backend codegen` after API/schema changes. Tests use Vitest and `convex-test`; no separate database is needed. The pre-commit hook runs the repository checks too.

[Architecture and feature guide](docs/architecture.md) explains ownership, the offline protocol and query scaling. [AGENTS.md](AGENTS.md) covers conventions, CI, releases and deployments.

## License

Suro is licensed under the [GNU Affero General Public License v3.0 or later](LICENSE). If you run a modified version of Suro as a network service, you must make your source code available to its users.
