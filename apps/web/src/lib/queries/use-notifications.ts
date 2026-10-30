"use client";

import { api } from "backend/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";
import { unreadItemCount } from "domain/notifications";
import type { UnreadSection } from "@/lib/notifications";

const NONE: readonly UnreadSection[] = [];

/**
 * The signed-in user's unread receipts across groups. Convex shares one
 * subscription between every caller.
 */
export function useUnreadNotifications(): readonly UnreadSection[] {
  const { isAuthenticated } = useConvexAuth();
  return (
    useQuery(api.notifications.unread, isAuthenticated ? {} : "skip") ?? NONE
  );
}

/** Unread receipts about one list, template, event, pot or note. */
export function useUnreadItemCount(projectId: string, id: string) {
  return unreadItemCount(useUnreadNotifications(), projectId, id);
}
