import { type NextFetchEvent, NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export const pathnameHeader = "x-pathname";

const intlMiddleware = createMiddleware(routing);

// next-intl reads X-Forwarded-Host/Port when building redirect URLs.
// Two failure modes:
//   Production: proxy sets x-forwarded-host: domain.com:3000 (internal port
//     leaks into Location header) → strip the port.
//   Local dev: Next.js dev server sets x-forwarded-host: localhost:3000 (same
//     host as the `host` header) → stripping the port drops it from the
//     redirect. Delete the header instead so next-intl falls back to `host`.
function sanitizeForwardedHeaders(request: NextRequest): NextRequest {
  const headers = new Headers(request.headers);
  let mutated = false;

  if (headers.has("x-forwarded-port")) {
    headers.delete("x-forwarded-port");
    mutated = true;
  }

  const xfh = headers.get("x-forwarded-host");
  if (xfh) {
    const xfhHostname = xfh.split(":")[0] ?? xfh;
    const hostHostname = (headers.get("host") ?? "").split(":")[0];

    if (xfhHostname === hostHostname) {
      // Same hostname as host header — locally-injected header (dev server or
      // local proxy). Remove it so next-intl uses the host header directly.
      headers.delete("x-forwarded-host");
      mutated = true;
    } else if (xfh !== xfhHostname) {
      // Different hostname — real reverse proxy forwarding. Strip the leaked
      // internal port from the public domain name.
      headers.set("x-forwarded-host", xfhHostname);
      mutated = true;
    }
  }

  if (!mutated) return request;
  return new NextRequest(request, { headers });
}

export function proxy(request: NextRequest, _event: NextFetchEvent) {
  const sanitized = sanitizeForwardedHeaders(request);

  // Skip i18n routing for API routes and static assets — let them through.
  const { pathname } = sanitized.nextUrl;
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/_vercel") ||
    pathname.startsWith("/ingest") ||
    pathname.includes(".")
  ) {
    const requestHeaders = new Headers(sanitized.headers);
    requestHeaders.set(
      pathnameHeader,
      `${sanitized.nextUrl.pathname}${sanitized.nextUrl.search}`,
    );
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const response = intlMiddleware(sanitized);
  response.headers.set(
    pathnameHeader,
    `${sanitized.nextUrl.pathname}${sanitized.nextUrl.search}`,
  );
  return response;
}

export const config = {
  matcher: ["/((?!_next|_vercel|ingest|.*\\..*).*)"],
};
