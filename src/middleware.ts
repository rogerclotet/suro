import { NextResponse, type NextRequest } from "next/server";

export const pathnameHeader = "x-pathname";

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(pathnameHeader, request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
