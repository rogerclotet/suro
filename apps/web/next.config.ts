import path from "node:path";
import { withPostHogConfig } from "@posthog/nextjs-config";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const cspReportOnly = [
  "default-src 'self'",
  // next/script + dev hot reload need 'unsafe-inline'/'unsafe-eval'; tighten later via nonces
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://utfs.io https://*.ufs.sh https://*.googleusercontent.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.ingest.posthog.com https://eu.i.posthog.com https://eu-assets.i.posthog.com https://*.uploadthing.com https://utfs.io https://*.ufs.sh",
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
  experimental: {
    // Restore pre-v15 Router Cache duration for dynamic routes.
    // Next.js 15+ defaults to 0 (every navigation refetches from server).
    // 30s makes back/forward and same-session revisits instant.
    staleTimes: {
      dynamic: 30,
    },
  },
  serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist", "sharp"],
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
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  // This is required to support PostHog trailing slash API request
  skipTrailingSlashRedirect: true,
} satisfies NextConfig;

// Source map upload runs at build time only. It needs a personal API key with
// error-tracking write access plus the environment ID. Gate on both:
// resolveConfig in @posthog/nextjs-config throws when sourcemaps are enabled
// without credentials, so builds that lack them (local dev, MR previews) must
// opt out rather than fail.
const posthogSourcemapsEnabled =
  !!process.env.POSTHOG_API_KEY && !!process.env.POSTHOG_ENV_ID;

export default withPostHogConfig(withNextIntl(nextConfig), {
  personalApiKey: process.env.POSTHOG_API_KEY ?? "",
  projectId: process.env.POSTHOG_ENV_ID ?? "",
  // PostHog EU API host. This is the app host the CLI uploads to, distinct from
  // the eu.i.posthog.com ingestion host the browser SDK posts events to.
  host: "https://eu.posthog.com",
  sourcemaps: {
    enabled: posthogSourcemapsEnabled,
    deleteAfterUpload: true,
  },
});
