// Metro config for the pnpm monorepo: watch the repo root and resolve hoisted
// deps + workspace packages (e.g. `backend`). Package exports are enabled so
// Tamagui's "react-native" condition and backend's generated api resolve.
const { getSentryExpoConfig } = require("@sentry/react-native/metro");
const path = require("node:path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getSentryExpoConfig(projectRoot, {
  includeWebReplay: false,
  includeWebFeedback: false,
  autoWrapExpoRouterErrorBoundary: true,
});

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
