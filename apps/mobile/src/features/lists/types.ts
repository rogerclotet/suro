import type { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
export type ListResult = NonNullable<FunctionReturnType<typeof api.lists.get>>;
export type Item = ListResult["items"][number];
export type Category = FunctionReturnType<
  typeof api.categories.listByProject
>[number];
export type Member = FunctionReturnType<typeof api.projects.members>[number];
export type MemberById = Map<Id<"users">, Member>;
/** Payload carried by a dragged item row into the drop zones. */
export type DragData = { id: Id<"listItems"> };

export type Section = { title: string; category: string | null; data: Item[] };
