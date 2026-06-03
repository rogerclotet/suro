import path from "node:path";
import { fileURLToPath } from "node:url";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const dir = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(dir, "../../drizzle");

/** Wait for Postgres to accept connections (a CI service may still be booting). */
async function connectWithRetry(url: string, attempts = 20) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const sql = postgres(url, { max: 1 });
    try {
      await sql`select 1`;
      return sql;
    } catch (err) {
      await sql.end({ timeout: 1 }).catch(() => {});
      if (attempt === attempts) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error("unreachable");
}

export default async function setup({
  provide,
}: {
  provide: (key: "databaseUrl", value: string) => void;
}) {
  // CI can point at a throwaway Postgres service via TEST_DATABASE_URL (a
  // dedicated var, never DATABASE_URL, so we can't accidentally truncate a dev
  // DB). Locally, spin a disposable container via Testcontainers.
  const provided = process.env.TEST_DATABASE_URL;
  let url: string;
  let teardown = async () => {};

  if (provided) {
    url = provided;
  } else {
    const container = await new PostgreSqlContainer(
      "postgres:17-alpine",
    ).start();
    url = container.getConnectionUri();
    teardown = async () => {
      await container.stop();
    };
  }

  // Apply the real migration history so the schema is byte-for-byte what prod runs.
  const sql = await connectWithRetry(url);
  try {
    await migrate(drizzle(sql), { migrationsFolder });
  } finally {
    await sql.end();
  }

  provide("databaseUrl", url);

  return teardown;
}

declare module "vitest" {
  interface ProvidedContext {
    databaseUrl: string;
  }
}
