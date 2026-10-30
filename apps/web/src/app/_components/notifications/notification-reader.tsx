"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { visitedReceiptIds } from "domain/notifications";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { notificationVisit } from "@/lib/notifications";
import { useUnreadNotifications } from "@/lib/queries/use-notifications";

function useDocumentVisible() {
  const [visible, setVisible] = useState(
    () =>
      typeof document === "undefined" || document.visibilityState === "visible",
  );
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return visible;
}

/**
 * Marks receipts read for the screen in front of the user: an item's own, a
 * whole page-level section, or vanished items on a section index. Anything
 * new for that screen is read too, since the user watches it change live.
 */
export function NotificationReader() {
  const unread = useUnreadNotifications();
  const markRead = useMutation(api.notifications.markRead);
  const pathname = usePathname();
  const params = useParams();
  const visible = useDocumentVisible();
  const requested = useRef(new Set<Id<"notifications">>());

  useEffect(() => {
    if (!visible) return;
    const pendingIds = new Set(unread.flatMap((receipt) => receipt.ids));
    for (const id of requested.current) {
      if (!pendingIds.has(id)) requested.current.delete(id);
    }
    const visit = notificationVisit(pathname, params);
    if (!visit) return;
    const ids = visitedReceiptIds(unread, visit).filter(
      (id) => !requested.current.has(id),
    );
    if (ids.length === 0) return;
    for (const id of ids) requested.current.add(id);
    markRead({ projectId: visit.projectId as Id<"projects">, ids }).catch(
      (error: unknown) => {
        // Keep the server badge on failure; the next update can retry.
        for (const id of ids) requested.current.delete(id);
        console.error("[notifications] markRead failed", error);
      },
    );
  }, [visible, unread, pathname, params, markRead]);

  return null;
}
