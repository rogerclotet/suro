import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import {
  normalizeCategoryName,
  resolveLegacyCategoryValue,
} from "./categories";

export type ListWithItems = Doc<"lists"> & { items: Doc<"listItems">[] };

/** Matches the Postgres order: completed asc, name asc, id asc. */
function compareItems(a: Doc<"listItems">, b: Doc<"listItems">) {
  if (a.completed && !b.completed) return 1;
  if (!a.completed && b.completed) return -1;
  const byName = a.name.localeCompare(b.name);
  return byName !== 0 ? byName : a._id.localeCompare(b._id);
}

/** Join a list with its items and sort them. */
export async function loadListWithItems(
  ctx: QueryCtx,
  list: Doc<"lists">,
): Promise<ListWithItems> {
  const items = await ctx.db
    .query("listItems")
    .withIndex("by_list", (q) => q.eq("listId", list._id))
    .collect();
  items.sort(compareItems);
  return { ...list, items };
}

/**
 * Flatten the items of the given templates (filtered to this project) into
 * insert-ready rows carrying category names. Mirrors createList's template
 * seeding.
 */
export async function instantiateTemplateItems(
  ctx: QueryCtx,
  projectId: Id<"projects">,
  templateIds: Id<"listTemplates">[],
): Promise<{ name: string; category: string | undefined }[]> {
  const result: { name: string; category: string | undefined }[] = [];
  for (const templateId of templateIds) {
    const template = await ctx.db.get(templateId);
    if (template === null || template.projectId !== projectId) {
      continue;
    }
    for (const item of template.items) {
      const name = normalizeCategoryName(item.category);
      const category =
        name === undefined
          ? undefined
          : await resolveLegacyCategoryValue(ctx, projectId, name);
      result.push({ name: item.name, category });
    }
  }
  return result;
}
