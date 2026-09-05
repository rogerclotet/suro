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
);
export type NotificationTarget = Infer<typeof notificationTarget>;

export const notificationSection = v.union(
  v.literal("calendar"),
  v.literal("lists"),
  v.literal("expenses"),
  v.literal("notes"),
  v.literal("files"),
  v.literal("members"),
);
export type NotificationSection = Infer<typeof notificationSection>;

export function sectionForTarget(
  target: NotificationTarget,
): NotificationSection {
  return target.kind === "templates" ? "lists" : target.kind;
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
  }
}
