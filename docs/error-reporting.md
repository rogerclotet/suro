# Error reporting

Web and mobile send production JavaScript errors to GlitchTip through the Sentry SDKs. PostHog still handles analytics and surveys. Error capture does not depend on PostHog being configured.

## Privacy

`packages/error-reporting` filters outgoing events with an allowlist. Reports contain error types, stack locations, sourcemap identifiers, release, environment, and a static action name when available. Convex errors also retain the per-request ID and function name/type from the SDK's error prefix. They omit account and device identifiers, request URLs, headers, cookies, bodies, breadcrumbs, form data, document IDs, arbitrary context, and original exception messages. Messages are omitted because they may interpolate private content; Convex failures receive a summary containing only the function name/type. IP inference is suppressed with `0.0.0.0` in the event. The network connection still exposes its source IP to your GlitchTip server and reverse proxy; configure their access-log retention separately.

Tracing, session tracking, replay, and native crash capture are disabled. Mobile retains the previous JavaScript error coverage, including unhandled rejections and React error boundaries. Native crashes require native privacy filters before enabling them, since they bypass JavaScript `beforeSend`.

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

The `production` and `production-apk` profiles enable reporting. The EAS post-install hook validates credentials and sets `SENTRY_RELEASE` from `EAS_BUILD_GIT_COMMIT_HASH` for Gradle and Xcode. The Expo manifest uses the same commit. The Sentry Expo plugin and Metro configuration produce and upload the actual release bundle's sourcemaps, including Hermes maps. Upload errors fail the native build, so existing submission jobs cannot publish it. Do not set `SENTRY_ALLOW_FAILURE=true` or `SENTRY_DISABLE_AUTO_UPLOAD=true`; production validation rejects both.

Use the existing `pnpm --filter mobile build:*` scripts for local native builds. Their wrapper supplies `SENTRY_RELEASE` to the native build environment. Local release builds also need the upload credentials in the shell. Development and preview profiles leave reporting disabled.

## Verification

The repository checks cover the privacy filter, release naming, required credentials, and migrated capture calls. A real upload and symbolication check requires your GlitchTip instance and credentials: build a production release, trigger a test exception in that build, confirm its release and readable source location, and inspect its event JSON for excluded data. This is infrastructure work and does not itself bump the app version; mobile distribution follows the next normal versioned release.
