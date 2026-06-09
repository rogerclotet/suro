import "server-only";

import {
  convexAuthNextjsToken,
  isAuthenticatedNextjs,
} from "@convex-dev/auth/nextjs/server";
import { api } from "backend/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

/** The Convex Auth JWT for the current request, or `undefined` if signed out. */
export function getAuthToken() {
  return convexAuthNextjsToken();
}

/** Whether the current request carries a valid Convex Auth session. */
export function isAuthenticated() {
  return isAuthenticatedNextjs();
}

/**
 * The current user (`users.me`) for the authenticated request, or `null` when
 * signed out. Server-side replacement for reading `session.user` from NextAuth.
 */
export async function fetchMe() {
  const token = await convexAuthNextjsToken();
  if (!token) {
    return null;
  }
  return fetchQuery(api.users.me, {}, { token });
}
