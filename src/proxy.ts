import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from "next/server";
import { Logger } from "next-axiom";

export const pathnameHeader = "x-pathname";

export function proxy(request: NextRequest, event: NextFetchEvent) {
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
