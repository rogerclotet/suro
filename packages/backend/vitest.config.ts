import { defineConfig } from "vitest/config";

// convex-test runs Convex functions in-memory; it needs the edge-runtime env
// and the convex-test package inlined.
export default defineConfig({
  test: {
    environment: "edge-runtime",
    // Convex injects these at runtime; convex-test doesn't, so file URL signing
    // (model/fileUrls.ts) would fall back to raw getUrl without them.
    env: {
      FILE_URL_SECRET: "test-secret",
      FILE_URL_BASE: "https://files.test.suroapp.cat",
    },
    server: { deps: { inline: ["convex-test"] } },
  },
});
