import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

/**
 * Integration tests run server actions + queries against a real Postgres
 * (spun up via Testcontainers in the global setup). These tests lock in the
 * Lists behavioral contract before the Convex migration; the same scenarios
 * are re-run against Convex with `convex-test` to prove parity.
 *
 * Run with `pnpm --filter web test:integration` (Docker must be available).
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    globalSetup: ["./test/integration/global-setup.ts"],
    setupFiles: ["./test/integration/setup.ts"],
    // One shared container; serialize files so DB state never races across them.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
