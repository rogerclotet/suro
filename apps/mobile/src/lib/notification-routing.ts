import type { api } from "backend/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { withHomeTabPrefix } from "./group-paths";

export type UnreadSection = FunctionReturnType<
  typeof api.notifications.unread
>[number];
export type NotificationSection = UnreadSection["section"];

export function notificationHref(receipt: UnreadSection): string {
  const destination = receipt.destination;
  const path =
    destination.kind === "calendar"
      ? `/${receipt.projectId}/calendar?date=${destination.startAt}`
      : withHomeTabPrefix(destination.path);
  return `${path}${path.includes("?") ? "&" : "?"}notification=${receipt.latestId}`;
}

/** Home itself has no read effect: its badges aggregate independent destinations. */
export function notificationVisit(
  pathname: string,
  settingsProjectId?: string,
) {
  if (pathname === "/group-settings" && settingsProjectId) {
    return { projectId: settingsProjectId, section: "members" as const };
  }
  const [projectId, tab, child] = pathname.split("/").filter(Boolean);
  if (!projectId) return null;
  switch (tab) {
    case "calendar":
    case "lists":
    case "expenses":
      return { projectId, section: tab };
    case "home":
      return child === "notes" || child === "files"
        ? { projectId, section: child }
        : null;
    default:
      return null;
  }
}

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
        ["notes", "files", "members"].includes(receipt.section));
    return count + (matches ? receipt.count : 0);
  }, 0);
}
