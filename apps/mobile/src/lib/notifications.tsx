import { api } from "backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { useGlobalSearchParams, usePathname, useRouter } from "expo-router";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import {
  type NotificationSection,
  notificationHref,
  notificationVisit,
  type UnreadSection,
} from "@/lib/notification-routing";
import { useAuthGate, usePersistentQuery } from "@/lib/offline";

const NotificationsContext = createContext<{
  unread: readonly UnreadSection[];
  captureVisit: (receipt: UnreadSection) => void;
}>({ unread: [], captureVisit: () => {} });

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthGate();
  const unread = usePersistentQuery(
    api.notifications.unread,
    isAuthenticated ? {} : "skip",
  );
  const markRead = useMutation(api.notifications.markRead);
  const pathname = usePathname();
  const params = useGlobalSearchParams<{
    projectId?: string;
    notification?: string;
    visit?: string;
  }>();
  const pending = useRef<UnreadSection | null>(null);
  const captureVisit = useCallback((receipt: UnreadSection) => {
    pending.current = receipt;
  }, []);
  const visit = notificationVisit(pathname, params.projectId);
  const key = visit ? `${visit.projectId}/${visit.section}` : null;
  const activation = params.visit || params.notification;
  const observed = useRef<{ key: string; activation?: string } | null>(null);

  useEffect(() => {
    if (key === null) {
      observed.current = null;
      return;
    }
    if (unread === undefined) return;
    const sameSection = observed.current?.key === key;
    if (
      sameSection &&
      (!activation || observed.current?.activation === activation)
    )
      return;
    const captured = pending.current;
    const receipt =
      captured && `${captured.projectId}/${captured.section}` === key
        ? captured
        : unread.find((row) => `${row.projectId}/${row.section}` === key);
    observed.current = {
      key,
      activation: receipt === captured ? captured?.latestId : activation,
    };
    if (!receipt) return;
    if (receipt === captured) pending.current = null;
    // A second navigation render may arrive after the captured receipts were
    // cleared. Never let that render consume a newer update in the section.
    const cutoff =
      receipt !== captured && params.notification
        ? receipt.ids.findIndex((id) => id === params.notification)
        : 0;
    if (cutoff < 0) return;
    const ids = receipt.ids.slice(cutoff);
    void markRead({ projectId: receipt.projectId, ids }).catch((error) => {
      // Keep the server badge on failure; a later visit can retry.
      console.error("[notifications] markRead failed", error);
    });
  }, [key, activation, params.notification, unread, markRead]);

  return (
    <NotificationsContext.Provider
      value={{ unread: unread ?? [], captureVisit }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useUnreadNotifications() {
  return useContext(NotificationsContext).unread;
}

export function useCaptureNotificationVisit() {
  return useContext(NotificationsContext).captureVisit;
}

export function useOpenNotificationSection(projectId: string) {
  const unread = useUnreadNotifications();
  const captureVisit = useCaptureNotificationVisit();
  const router = useRouter();
  return (section: NotificationSection, fallback: string) => {
    const receipt = unread.find(
      (row) => row.projectId === projectId && row.section === section,
    );
    if (receipt) captureVisit(receipt);
    router.navigate(receipt ? notificationHref(receipt) : fallback, {
      withAnchor: true,
    });
  };
}
