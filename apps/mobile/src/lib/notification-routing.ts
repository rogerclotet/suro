import type { api } from "backend/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import type { NotificationVisit } from "domain/notifications";

export type UnreadSection = FunctionReturnType<
  typeof api.notifications.unread
>[number];
export type NotificationSection = UnreadSection["section"];
export type UnreadItem = UnreadSection["targets"][number];

// Screens Home and Calendar host for an event and its attachments, so the back
// button returns to where they were opened (see lib/tab-routes.ts). Calendar
// shows events at `calendar/<eventId>` itself.
const ATTACHED_SCREENS: Record<string, ReadonlySet<string>> = {
  home: new Set(["event", "list", "note", "expense"]),
  calendar: new Set(["list", "note", "expense"]),
};

/**
 * Map a route to what it reads. Item screens read their own receipts, section
 * indexes only clear vanished items, and Home reads nothing: its badges add up
 * other screens' receipts.
 */
export function notificationVisit(
  pathname: string,
  settingsProjectId?: string,
): NotificationVisit | null {
  if (pathname === "/group-settings") {
    return settingsProjectId
      ? { projectId: settingsProjectId, scope: "page", section: "members" }
      : null;
  }
  const [projectId, tab, first, second] = pathname.split("/").filter(Boolean);
  if (!projectId || !tab) return null;
  const item = (id: string | undefined): NotificationVisit | null =>
    id ? { projectId, scope: "item", id } : null;
  const index = (section: NotificationSection): NotificationVisit => ({
    projectId,
    scope: "index",
    section,
  });
  const page = (section: NotificationSection): NotificationVisit => ({
    projectId,
    scope: "page",
    section,
  });

  if (first && ATTACHED_SCREENS[tab]?.has(first)) return item(second);
  switch (tab) {
    case "lists":
      if (!first) return index("lists");
      if (first === "tasks") return null;
      return first === "templates" ? item(second) : item(first);
    case "calendar":
      return first ? item(first) : index("calendar");
    case "expenses":
      if (!first) return index("expenses");
      return first === "solo-expenses" ? null : item(first);
    case "home":
      switch (first) {
        case "notes":
          return second ? item(second) : index("notes");
        case "files":
          return page("files");
        case "secret-santa":
          return page("secretSanta");
        default:
          return null;
      }
    default:
      return null;
  }
}

/** Unread items of one section in a group, newest first. */
export function unreadItems(
  receipts: readonly UnreadSection[],
  projectId: string,
  section: NotificationSection,
): UnreadItem[] {
  return receipts
    .filter(
      (receipt) =>
        receipt.projectId === projectId && receipt.section === section,
    )
    .flatMap((receipt) => receipt.targets);
}

/**
 * Unread receipts in a group, optionally for one section. `home` adds up the
 * sections opened from Home's chips; member changes show on the group title.
 */
export function unreadCount(
  receipts: readonly UnreadSection[],
  projectId: string,
  section?: NotificationSection | "home",
) {
  return receipts.reduce((count, receipt) => {
    if (receipt.projectId !== projectId) return count;
    const matches =
      section === undefined ||
      section === receipt.section ||
      (section === "home" &&
        ["notes", "files", "secretSanta"].includes(receipt.section));
    return count + (matches ? receipt.count : 0);
  }, 0);
}

/** Unread receipts in every group except `projectId`. */
export function unreadElsewhere(
  receipts: readonly UnreadSection[],
  projectId: string,
) {
  return receipts.reduce(
    (count, receipt) =>
      receipt.projectId === projectId ? count : count + receipt.count,
    0,
  );
}
