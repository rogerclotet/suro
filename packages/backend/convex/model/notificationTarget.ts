import { type Infer, v } from "convex/values";
import type { Id } from "../_generated/dataModel";

export const notificationTarget = v.union(
  v.object({ kind: v.literal("calendar"), eventId: v.id("events") }),
  v.object({ kind: v.literal("lists"), listId: v.id("lists") }),
  v.object({ kind: v.literal("templates"), templateId: v.id("listTemplates") }),
  v.object({ kind: v.literal("expenses"), potId: v.id("pots") }),
  v.object({ kind: v.literal("notes"), noteId: v.id("notes") }),
  v.object({ kind: v.literal("files") }),
  v.object({ kind: v.literal("members") }),
  v.object({
    kind: v.literal("secretSanta"),
    secretSantaId: v.id("secretSantas"),
  }),
);
export type NotificationTarget = Infer<typeof notificationTarget>;

export const notificationSection = v.union(
  v.literal("calendar"),
  v.literal("lists"),
  v.literal("expenses"),
  v.literal("notes"),
  v.literal("files"),
  v.literal("members"),
  v.literal("secretSanta"),
);
export type NotificationSection = Infer<typeof notificationSection>;

export function sectionForTarget(
  target: NotificationTarget,
): NotificationSection {
  return target.kind === "templates" ? "lists" : target.kind;
}

/**
 * The document a receipt is about, for targets that have their own screen.
 * Files, members and Secret Santa are read as a whole page, so they have none.
 */
export function targetItem(target: NotificationTarget) {
  switch (target.kind) {
    case "calendar":
      return { kind: target.kind, id: target.eventId };
    case "lists":
      return { kind: target.kind, id: target.listId };
    case "templates":
      return { kind: target.kind, id: target.templateId };
    case "expenses":
      return { kind: target.kind, id: target.potId };
    case "notes":
      return { kind: target.kind, id: target.noteId };
    case "files":
    case "members":
    case "secretSanta":
      return null;
  }
}

/** Canonical destinations shared with push delivery. Native adds its Home prefix. */
export function notificationPath(
  projectId: Id<"projects">,
  target: NotificationTarget,
): string {
  switch (target.kind) {
    case "calendar":
      return `/${projectId}/calendar/${target.eventId}`;
    case "lists":
      return `/${projectId}/lists/${target.listId}`;
    case "templates":
      return `/${projectId}/lists/templates/${target.templateId}`;
    case "expenses":
      return `/${projectId}/expenses/${target.potId}`;
    case "notes":
      return `/${projectId}/notes/${target.noteId}`;
    case "files":
      return `/${projectId}/files`;
    case "members":
      return `/group-settings?projectId=${projectId}`;
    case "secretSanta":
      return `/${projectId}/secret-santa`;
  }
}
