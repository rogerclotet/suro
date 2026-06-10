import type { api } from "backend/convex/_generated/api";
import type { Doc } from "backend/convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import type { Category } from "./category";

export type { Category };

/**
 * List / item / template shapes consumed across the app. Backed by Convex via
 * the adapters below, but kept field-compatible with the former Drizzle shape so
 * components don't change. Ids are Convex ids (strings); timestamps are `Date`.
 */
export type ListItem = {
  id: string;
  listId: string;
  name: string;
  details: string | null;
  completed: boolean | null;
  categoryId: string | null;
  category: Category | null;
  createdBy: string;
  updatedBy: string | null;
  updatedAt: Date | null;
  createdAt: Date | null;
};

export type ListEvent = {
  id: string;
  name: string;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
};

export type List = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  favorite: boolean;
  eventId: string | null;
  createdBy: string;
  updatedBy: string | null;
  updatedAt: Date | null;
  createdAt: Date | null;
  items: ListItem[];
  event: ListEvent | null;
};

export type TemplateItem = { name: string; category: string | null };

export type Template = {
  id: string;
  name: string;
  description: string | null;
  projectId: string;
  items: TemplateItem[];
  createdAt: Date | null;
  updatedAt: Date | null;
};

type ConvexListWithItems = FunctionReturnType<
  typeof api.lists.listByProject
>[number];
type ConvexItem = ConvexListWithItems["items"][number];

function adaptCategory(c: Doc<"categories">): Category {
  return { id: c._id, name: c.name, projectId: c.projectId };
}

function adaptItem(i: ConvexItem): ListItem {
  return {
    id: i._id,
    listId: i.listId,
    name: i.name,
    details: i.details ?? null,
    completed: i.completed,
    categoryId: i.categoryId ?? null,
    category: i.category ? adaptCategory(i.category) : null,
    createdBy: i.createdBy,
    updatedBy: i.updatedBy ?? null,
    updatedAt: i.updatedAt ? new Date(i.updatedAt) : null,
    createdAt: new Date(i._creationTime),
  };
}

function adaptEvent(e: Doc<"events">): ListEvent {
  return {
    id: e._id,
    name: e.name,
    startAt: new Date(e.startAt),
    endAt: new Date(e.endAt),
    allDay: e.allDay,
  };
}

/** Map a Convex list (from `listByProject` or `get`) to the app's `List`. */
export function adaptList(
  l: ConvexListWithItems,
  event?: Doc<"events"> | null,
): List {
  return {
    id: l._id,
    projectId: l.projectId,
    name: l.name,
    description: l.description ?? null,
    favorite: l.favorite,
    eventId: l.eventId ?? null,
    createdBy: l.createdBy,
    updatedBy: l.updatedBy ?? null,
    updatedAt: l.updatedAt ? new Date(l.updatedAt) : null,
    createdAt: new Date(l._creationTime),
    items: l.items.map(adaptItem),
    event: event ? adaptEvent(event) : null,
  };
}

type ConvexTemplate = FunctionReturnType<
  typeof api.templates.listByProject
>[number];

/** Map a Convex template to the app's `Template`. */
export function adaptTemplate(t: ConvexTemplate): Template {
  return {
    id: t._id,
    name: t.name,
    description: t.description ?? null,
    projectId: t.projectId,
    items: t.items,
    createdAt: new Date(t._creationTime),
    updatedAt: t.updatedAt ? new Date(t.updatedAt) : null,
  };
}
