import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs/config";
import { currentRelease, requireUploadConfig } from "error-reporting/build";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const sentryOrigin = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? new URL(process.env.NEXT_PUBLIC_SENTRY_DSN).origin
  : "";

const cspReportOnly = [
  "default-src 'self'",
  // next/script + dev hot reload need 'unsafe-inline'/'unsafe-eval'; tighten later via nonces
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://utfs.io https://*.ufs.sh https://*.googleusercontent.com https://*.convex.cloud https://*.suroapp.cat https://*.convex.site",
  "font-src 'self' data:",
  `connect-src 'self' https://*.ingest.posthog.com https://eu.i.posthog.com https://eu-assets.i.posthog.com https://*.uploadthing.com https://utfs.io https://*.ufs.sh https://*.convex.cloud wss://*.convex.cloud https://*.suroapp.cat https://*.convex.site ${sentryOrigin}`,
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
];

const nextConfig = {
  output: "standalone",
  // pnpm monorepo: trace from the repo root so the standalone bundle includes
  // workspace-hoisted deps. Without this, Next guesses the app dir and the
  // standalone server is missing modules at runtime.
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  transpilePackages: ["design-tokens", "domain", "error-reporting"],
  experimental: {
    // Restore pre-v15 Router Cache duration for dynamic routes.
    // Next.js 15+ defaults to 0 (every navigation refetches from server).
    // 30s makes back/forward and same-session revisits instant.
    staleTimes: {
      dynamic: 30,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "*.ufs.sh",
      },
      {
        // Convex file storage serves avatars/group images/files from
        // <deployment>.convex.cloud and its regional variant
        // (<deployment>.<region>.convex.cloud); ** covers both, across the
        // dev and prod deployments. Still needed for avatars/group images
        // stored before branded file URLs were enabled.
        protocol: "https",
        hostname: "**.convex.cloud",
      },
      {
        // Branded, token-gated file URLs (backend model/fileUrls.ts) serve from
        // a host we own — files.suroapp.cat in prod — proxied to the Convex
        // HTTP-actions origin. ** also covers the *.convex.site fallback host
        // used until FILE_URL_BASE is set.
        protocol: "https",
        hostname: "**.suroapp.cat",
      },
      {
        protocol: "https",
        hostname: "**.convex.site",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // The AASA file has no extension, so Next serves it as octet-stream by
        // default; force application/json so the OS accepts it.
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://eu-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  // This is required to support PostHog trailing slash API request
  skipTrailingSlashRedirect: true,
} satisfies NextConfig;

// Production uploads are mandatory once reporting is enabled. Preview and
// compile-check builds do not set this environment, even with NODE_ENV=production.
const reporting = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT === "production";
if (reporting) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN)
    throw new Error(
      "Production error reporting requires NEXT_PUBLIC_SENTRY_DSN",
    );
  requireUploadConfig();
  process.env.NEXT_PUBLIC_SENTRY_RELEASE = currentRelease();
}

export default withSentryConfig(withNextIntl(nextConfig), {
  sentryUrl: process.env.SENTRY_URL,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  telemetry: false,
  // Navigation tracing is intentionally disabled.
  suppressOnRouterTransitionStartWarning: true,
  silent: !reporting,
  release: {
    name: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    create: reporting,
    finalize: reporting,
  },
  sourcemaps: {
    disable: !reporting,
    assets: [
      ".next/static/**/*.js",
      ".next/static/**/*.map",
      ".next/server/**/*.js",
      ".next/server/**/*.map",
    ],
    deleteSourcemapsAfterUpload: true,
  },
  widenClientFileUpload: true,
  // The SDK otherwise logs upload failures and continues the build.
  errorHandler(error) {
    throw error;
  },
});
