import { type NextFetchEvent, NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export const pathnameHeader = "x-pathname";

const intlMiddleware = createMiddleware(routing);

// The reverse proxy forwards the container's internal port via X-Forwarded-Port
// (and sometimes inside X-Forwarded-Host). next-intl reads those when building
// redirect URLs, which leaks the upstream port into the public Location header.
function sanitizeForwardedPort(request: NextRequest): NextRequest {
  const headers = new Headers(request.headers);
  let mutated = false;

  if (headers.has("x-forwarded-port")) {
    headers.delete("x-forwarded-port");
    mutated = true;
  }

  const xfh = headers.get("x-forwarded-host");
  if (xfh?.includes(":")) {
    headers.set("x-forwarded-host", xfh.replace(/:\d+$/, ""));
    mutated = true;
  }

  if (!mutated) return request;
  return new NextRequest(request, { headers });
}

export function proxy(request: NextRequest, _event: NextFetchEvent) {
  const sanitized = sanitizeForwardedPort(request);

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
