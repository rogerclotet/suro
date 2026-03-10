import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from "next/server";

export const pathnameHeader = "x-pathname";

export function proxy(request: NextRequest, _event: NextFetchEvent) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    pathnameHeader,
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
