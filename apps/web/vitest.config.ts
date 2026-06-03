import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    // Integration tests need a real Postgres and run via the separate
    // `test:integration` config (vitest.integration.config.ts).
    exclude: [...configDefaults.exclude, "**/*.integration.test.ts"],
  },
});
