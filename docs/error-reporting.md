# Error reporting

Web and mobile send production JavaScript errors to GlitchTip through the Sentry SDKs. PostHog still handles analytics and surveys. Error capture does not depend on PostHog being configured.

## Privacy

`packages/error-reporting` filters outgoing events with an allowlist. Reports contain original error messages and exception types, stack locations, sourcemap identifiers, release, environment, and a static action name when available. Convex errors also retain the per-request ID and function name/type from the SDK's error prefix. The surrounding event metadata omits account and device identifiers, request URLs, headers, cookies, bodies, breadcrumbs, form data, document IDs, and arbitrary context. Error messages are preserved verbatim, including Convex messages, so any values interpolated into those messages remain visible in GlitchTip. IP inference is suppressed with `0.0.0.0` in the event. The network connection still exposes its source IP to your GlitchTip server and reverse proxy; configure their access-log retention separately.

Tracing, session tracking, replay, and SDK logs are disabled. Production mobile builds capture JavaScript errors, unhandled rejections, React error boundaries, and native iOS/Android crashes. Expo Router error boundaries are wrapped by the Sentry Metro configuration.

Native capture starts in `AppDelegate` / `MainApplication` before React Native loads. The Expo plugin generates `sentry.options.json` with the public DSN, release, and production settings; no upload token is bundled. JavaScript connects to the existing native SDK without reinitializing it. Debug, development, and preview builds do not initialize native capture.

Native events bypass JavaScript `beforeSend`. `apps/mobile/plugins/native-error-reporting` installs native callbacks that build a new event containing only error messages, exceptions, thread stacks, symbolication data, SDK metadata, release/build/environment, timestamp, and event ID. Account/device context, request data, breadcrumbs, arbitrary tags and extras are excluded, and IP inference is suppressed. Error messages remain verbatim. Native stack traces and loaded-image data remain intact for symbolication.

These changes do not change the existing PostHog analytics identification or survey behavior.

## Convex failures

Backend failures are reported when they reach a web/mobile error boundary, an unhandled rejection, or an explicit capture call. This retains the previous PostHog approach and works with Convex's free plan. Next.js server errors also use Sentry. No Convex integration, relay, or log collector is required.

In GlitchTip, copy the `convex_request_id` tag into the Convex dashboard's Logs search to inspect the backend trace. This ID identifies a single request, not an account. `convex_function` and `convex_function_type` are included when the client error contains them. Convex redacts backend stack traces in production responses, so the uploaded web/mobile sourcemaps resolve the client call site; the backend trace stays in Convex. See [Convex's request ID documentation](https://docs.convex.dev/functions/debugging#finding-relevant-logs-by-request-id).

Background failures that never reach a client and errors swallowed without an explicit capture remain visible only in Convex. The release on a client-reported failure identifies that client's code, which may differ from the backend's current deployed commit.

## Web production build

Set these GitHub Actions secrets:

| Secret | Value |
| --- | --- |
| `NEXT_PUBLIC_SENTRY_DSN` | GlitchTip project DSN |
| `SENTRY_URL` | HTTPS origin of your GlitchTip instance |
| `SENTRY_ORG` | Organization slug |
| `SENTRY_PROJECT` | Project slug |
| `SENTRY_AUTH_TOKEN` | Token allowed to create releases and upload sourcemaps |

The production workflow sets `NEXT_PUBLIC_SENTRY_ENVIRONMENT=production` and supplies the deployed commit as `SURO_COMMIT_SHA`. Next derives `NEXT_PUBLIC_SENTRY_RELEASE` as `suro@` plus the first seven commit characters. The same value labels runtime events and uploaded source maps. Docker receives the upload token through a BuildKit secret, not an image build argument. Maps are uploaded during compilation and deleted afterward. Missing configuration or a failed upload fails the build before the image can be pushed or deployed.

For a manual production build, supply those values as environment variables, plus `NEXT_PUBLIC_SENTRY_ENVIRONMENT=production`. Outside Docker, the commit falls back to `git rev-parse HEAD`.

Preview and PR compile-check builds leave the reporting environment unset, so they neither report errors nor require upload credentials. `NODE_ENV=production` alone does not enable reporting. Remove the obsolete `POSTHOG_API_KEY` and `POSTHOG_ENV_ID` sourcemap secrets after switching.

## Mobile production build

Set `EXPO_PUBLIC_SENTRY_DSN`, `SENTRY_URL`, `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` in the **EAS production environment**. Use sensitive visibility for the DSN and ordinary build configuration, and secret visibility for the upload token. GitHub runner environment variables are not automatically forwarded to EAS workers. Web and mobile may use the same project or separate projects by assigning their respective environment values.

The `production` and `production-apk` profiles enable reporting. The EAS post-install hook validates credentials and sets `SENTRY_RELEASE` from `EAS_BUILD_GIT_COMMIT_HASH` for Gradle and Xcode. The Expo manifest uses the same commit. The Sentry Expo plugin and Metro configuration produce and upload the actual release bundle's sourcemaps, including Hermes maps. iOS builds upload dSYMs; the Sentry Android Gradle plugin uploads native symbols and ProGuard/R8 mappings when present. Native source uploads are disabled. Keep `SENTRY_DISABLE_XCODE_DEBUG_UPLOAD=false` in production profiles. Upload errors fail the native build, so existing submission jobs cannot publish it. Do not set `SENTRY_ALLOW_FAILURE=true` or `SENTRY_DISABLE_AUTO_UPLOAD=true`; production validation rejects both.

Use the existing `pnpm --filter mobile build:*` scripts for local native builds. Their wrapper supplies `SENTRY_RELEASE` to the native build environment. Local release builds also need the upload credentials in the shell. Development and preview profiles leave reporting disabled.

## Verification

The repository checks cover the privacy filter, release naming, required credentials, and migrated capture calls. A real upload and symbolication check requires your GlitchTip instance and credentials: build a production release, trigger a test exception in that build, confirm its release and readable source location, and inspect its event JSON for excluded data. This is infrastructure work and does not itself bump the app version; mobile distribution follows the next normal versioned release.

## Temporary mobile diagnostics

The unlinked `suro:///error-test` route is included temporarily for testing store builds. Open that URL on a device with Suro installed. It only opens the screen; a native crash requires pressing a button and confirming. There are no automatic crash triggers in the URL.

Use a new production build on each platform. The screen has separate tests for explicit capture, an uncaught JavaScript error, an unhandled rejection, a render error, and a native crash. Tests are disabled when reporting is off. Run one test at a time; JavaScript failures may require reopening the app. After the native crash, reopen the app and leave it online so the saved report can upload. Test without a debugger attached.

In GlitchTip, verify the message, matching `suro@<commit>` release and build number, readable source locations, and the filtered event JSON. Native crash reports use the SDK's own crash message. Review the EAS build logs for both JavaScript map and native symbol uploads. The installed GlitchTip server must support native symbol ingestion and processing.

Remove `apps/mobile/src/app/error-test.tsx` and the `errorTest` translation namespaces after testing. Keep the native reporting plugin, initialization, symbol uploads, and their tests.
