"use client";

import { useConvexAuth } from "convex/react";
import { useMe } from "@/hooks/use-me";
import { type Session, toSession } from "@/lib/auth-session";

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

/**
 * Convex-backed replacement for NextAuth's `useSession()`. Returns the same
 * `{ data, status }` shape so existing components keep working unchanged.
 */
export function useSession(): { data: Session | null; status: SessionStatus } {
  const { isLoading } = useConvexAuth();
  const me = useMe();

  if (isLoading || me === undefined) {
    return { data: null, status: "loading" };
  }
  if (me === null) {
    return { data: null, status: "unauthenticated" };
  }
  return { data: toSession(me), status: "authenticated" };
}
