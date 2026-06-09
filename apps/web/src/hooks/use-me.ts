"use client";

import { api } from "backend/convex/_generated/api";
import { useQuery } from "convex/react";

/**
 * The current signed-in user (`users.me`). Returns `undefined` while loading and
 * `null` when signed out. Client-side replacement for NextAuth's `useSession`.
 */
export function useMe() {
  return useQuery(api.users.me);
}
