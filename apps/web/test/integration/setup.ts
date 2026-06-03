import { inject } from "vitest";

// Runs in each worker before any test module is imported, so `@/env` and the
// db connection pick up the Testcontainers Postgres URL.
process.env.SKIP_ENV_VALIDATION = "1";
process.env.DATABASE_URL = inject("databaseUrl");
