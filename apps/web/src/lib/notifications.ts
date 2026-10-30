import type { api } from "backend/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import type { NotificationVisit } from "domain/notifications";

export type UnreadSection = FunctionReturnType<
  typeof api.notifications.unread
>[number];
export type NotificationSection = UnreadSection["section"];
export type UnreadItem = UnreadSection["targets"][number];

type RouteParams = Partial<
  Record<
    "projectId" | "listId" | "templateId" | "eventId" | "potId" | "noteId",
    string | string[]
  >
>;

const GROUP = "/groups/[projectId]";

// Item screens read their own receipts. `usePathname` returns these canonical
// templates; the ids come from the route params.
const ITEM_ROUTES: Record<string, keyof RouteParams> = {
  [`${GROUP}/lists/[listId]`]: "listId",
  [`${GROUP}/lists/templates/[templateId]`]: "templateId",
  [`${GROUP}/calendar/[eventId]`]: "eventId",
  [`${GROUP}/expenses/[potId]`]: "potId",
  [`${GROUP}/notes/[noteId]`]: "noteId",
  [`${GROUP}/notes/[noteId]/edit`]: "noteId",
};

// Section indexes only clear items that no longer exist.
const INDEX_ROUTES: Record<string, NotificationSection> = {
  [`${GROUP}/lists`]: "lists",
  [`${GROUP}/calendar`]: "calendar",
  [`${GROUP}/expenses`]: "expenses",
  [`${GROUP}/notes`]: "notes",
};

// Pages that show their whole section at once.
const PAGE_ROUTES: Record<string, NotificationSection> = {
  [`${GROUP}/files`]: "files",
  [`${GROUP}/secret-santa`]: "secretSanta",
  [`${GROUP}/secret-santa/ideas`]: "secretSanta",
  [`${GROUP}/settings`]: "members",
};

function param(params: RouteParams, key: keyof RouteParams) {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

/** What a route reads. Home and account pages read nothing. */
export function notificationVisit(
  pathname: string,
  params: RouteParams,
): NotificationVisit | null {
  const projectId = param(params, "projectId");
  if (!projectId) return null;
  const itemParam = ITEM_ROUTES[pathname];
  if (itemParam) {
    const id = param(params, itemParam);
    return id ? { projectId, scope: "item", id } : null;
  }
  const index = INDEX_ROUTES[pathname];
  if (index) return { projectId, scope: "index", section: index };
  const page = PAGE_ROUTES[pathname];
  return page ? { projectId, scope: "page", section: page } : null;
}

// Nav entries are keyed by their route segment.
const MENU_SECTIONS: Record<string, NotificationSection> = {
  lists: "lists",
  calendar: "calendar",
  expenses: "expenses",
  files: "files",
  notes: "notes",
  "secret-santa": "secretSanta",
};

/** The notification section behind a nav entry's route segment, if any. */
export function menuSection(segment: string): NotificationSection | undefined {
  return MENU_SECTIONS[segment];
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

// Sections the mobile bottom bar reaches through Home's chips. Group settings
// (members) hang off the group switcher on the web, not the dashboard.
const HOME_CHIP_SECTIONS: readonly NotificationSection[] = [
  "notes",
  "files",
  "secretSanta",
];

/**
 * Unread receipts in a group, optionally for one section. `home` adds up the
 * sections reached from the dashboard's chips rather than their own nav entry.
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
      (section === "home" && HOME_CHIP_SECTIONS.includes(receipt.section));
    return count + (matches ? receipt.count : 0);
  }, 0);
}

/** Unread receipts in every group except `projectId`. */
export function unreadElsewhere(
  receipts: readonly UnreadSection[],
  projectId: string | undefined,
) {
  return receipts.reduce(
    (count, receipt) =>
      receipt.projectId === projectId ? count : count + receipt.count,
    0,
  );
}

/** Unread receipts of one section across every group. */
export function unreadInSection(
  receipts: readonly UnreadSection[],
  section: NotificationSection,
) {
  return receipts.reduce(
    (count, receipt) =>
      receipt.section === section ? count + receipt.count : count,
    0,
  );
}
