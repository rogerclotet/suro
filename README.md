# Família

Family/group management app.

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
pnpm eslint
pnpm biome:check
pnpm typecheck
pnpm test
```

### Run the app locally

```bash
pnpm dev
```
