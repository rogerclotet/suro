import { defineConfig } from "vitest/config";

// convex-test runs Convex functions in-memory; it needs the edge-runtime env
// and the convex-test package inlined.
export default defineConfig({
  test: {
    environment: "edge-runtime",
    server: { deps: { inline: ["convex-test"] } },
  },
});
