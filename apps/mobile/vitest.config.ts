import path from "node:path";
import { defineConfig } from "vitest/config";

// The mobile suite covers the pure logic ported from the PWA (calendar dates,
// money, files, avatar colors, locale + URL helpers). These modules pull in no
// react-native/expo code, so a plain Node environment is enough — no native
// mocking or jsdom required.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
