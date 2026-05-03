import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export const pathnameHeader = "x-pathname";

const intlMiddleware = createMiddleware(routing);

export function proxy(request: NextRequest, _event: NextFetchEvent) {
  // Skip i18n routing for API routes and static assets — let them through.
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/_vercel") ||
    pathname.startsWith("/ingest") ||
    pathname.includes(".")
  ) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(
      pathnameHeader,
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const response = intlMiddleware(request);
  response.headers.set(
    pathnameHeader,
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return response;
}

export const config = {
  matcher: ["/((?!_next|_vercel|ingest|.*\\..*).*)"],
};
