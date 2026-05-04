import { withPostHogConfig } from "@posthog/nextjs-config";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const cspReportOnly = [
  "default-src 'self'",
  // next/script + dev hot reload need 'unsafe-inline'/'unsafe-eval'; tighten later via nonces
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://utfs.io https://*.googleusercontent.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.ingest.posthog.com https://eu.i.posthog.com https://eu-assets.i.posthog.com https://*.uploadthing.com https://utfs.io",
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
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
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

export default withPostHogConfig(withNextIntl(nextConfig), {
  personalApiKey: process.env.POSTHOG_API_KEY ?? "",
  envId: process.env.POSTHOG_ENV_ID ?? "",
  host: "https://eu.i.posthog.com",
  sourcemaps: {
    enabled: true,
    deleteAfterUpload: true,
  },
});
