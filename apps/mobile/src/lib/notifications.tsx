import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { unreadItemCount, visitedReceiptIds } from "domain/notifications";
import { useGlobalSearchParams, usePathname } from "expo-router";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import {
  notificationVisit,
  type UnreadSection,
} from "@/lib/notification-routing";
import { useAuthGate, usePersistentQuery } from "@/lib/offline";

const NotificationsContext = createContext<readonly UnreadSection[]>([]);

function useAppActive() {
  const [active, setActive] = useState(AppState.currentState === "active");
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) =>
      setActive(state === "active"),
    );
    return () => subscription.remove();
  }, []);
  return active;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthGate();
  const unread = usePersistentQuery(
    api.notifications.unread,
    isAuthenticated ? {} : "skip",
  );
  const markRead = useMutation(api.notifications.markRead);
  const pathname = usePathname();
  const { projectId: settingsProjectId } = useGlobalSearchParams<{
    projectId?: string;
  }>();
  // Only a screen in front of the user reads: a backgrounded app can still
  // receive updates for the screen it was left on.
  const active = useAppActive();
  const requested = useRef(new Set<Id<"notifications">>());

  // While a screen is focused, anything new for it is read too: the user is
  // watching it change live.
  useEffect(() => {
    if (!active || unread === undefined) return;
    const pendingIds = new Set(unread.flatMap((receipt) => receipt.ids));
    for (const id of requested.current) {
      if (!pendingIds.has(id)) requested.current.delete(id);
    }
    const visit = notificationVisit(pathname, settingsProjectId);
    if (!visit) return;
    const ids = visitedReceiptIds(unread, visit).filter(
      (id) => !requested.current.has(id),
    );
    if (ids.length === 0) return;
    for (const id of ids) requested.current.add(id);
    void markRead({ projectId: visit.projectId as Id<"projects">, ids }).catch(
      (error: unknown) => {
        // Keep the server badge on failure; the next update can retry.
        for (const id of ids) requested.current.delete(id);
        console.error("[notifications] markRead failed", error);
      },
    );
  }, [active, unread, pathname, settingsProjectId, markRead]);

  return (
    <NotificationsContext.Provider value={unread ?? []}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useUnreadNotifications() {
  return useContext(NotificationsContext);
}

/** Unread receipts about one list, template, event, pot or note. */
export function useUnreadItemCount(projectId: string, id: string) {
  return unreadItemCount(useUnreadNotifications(), projectId, id);
}
