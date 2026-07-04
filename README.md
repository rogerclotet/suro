# Suro

A shared corkboard for the people you do life with. Suro keeps your group's lists, calendar, files, notes, shared expenses and Secret Santa in one place. Built for flatmates, family and friend groups.

## What's inside

- **Lists**: shopping, packing, to-dos. Categorize items, save reusable templates, check things off together in real time.
- **Calendar**: shared events with the option to link a list to an event (so the packing list lives next to the trip).
- **Files & notes**: share photos, PDFs and rich-text notes with the whole group.
- **Expenses**: track who paid for what, split fairly, and let Suro suggest the simplest way to settle up.
- **Secret Santa**: private gift exchange with custom exclusions and a hidden ideas list only your match can see.
- **Notifications**: in-app and push, only when something actually changes in your group.

The interface is available in Catalan, Spanish and English.

## How to develop

### Install pnpm to your system

[Follow the official guide](https://pnpm.io/installation)

### Create a `.env` file

Copy `.env.example` to `.env`. Make sure you change the `NEXTAUTH_SECRET` value.

You may need to fill in some values using your accounts. All services used have free tiers, you just have to create an account and get your credentials.

### Install dependencies

```bash
pnpm install
```

### Run linter and tests

```bash
pnpm biome:check
pnpm typecheck
pnpm test
```

### Run the app locally

```bash
pnpm dev
```

## License

Suro is licensed under the [GNU Affero General Public License v3.0 or later](LICENSE). If you run a modified version of Suro as a network service, you must make your source code available to its users.
