import { Logger } from "next-axiom";
import {
  NextResponse,
  type NextFetchEvent,
  type NextRequest,
} from "next/server";

export const pathnameHeader = "x-pathname";

export function middleware(request: NextRequest, event: NextFetchEvent) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(pathnameHeader, request.nextUrl.pathname);

  const logger = new Logger({ source: "middleware" });
  logger.middleware(request);

  event.waitUntil(logger.flush());

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
