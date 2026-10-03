import { execFileSync } from "node:child_process";
import { currentRelease, requireUploadConfig } from "error-reporting/build";

if (process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT === "production") {
  if (!process.env.EXPO_PUBLIC_SENTRY_DSN)
    throw new Error("Production builds require EXPO_PUBLIC_SENTRY_DSN");
  requireUploadConfig();
  const release = currentRelease();
  // EAS persists this for Gradle/Xcode, including the Hermes sourcemap upload.
  // Local builds inherit it from build-with-release.mjs instead.
  if (process.env.EAS_BUILD_RUNNER === "eas-build") {
    execFileSync("set-env", ["SENTRY_RELEASE", release]);
  } else if (process.env.SENTRY_RELEASE !== release) {
    throw new Error(
      "Run local builds using the build:* scripts so SENTRY_RELEASE matches the app",
    );
  }
}
