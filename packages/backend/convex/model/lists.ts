import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { resolveProjectCategoryId } from "./permissions";

export type ItemWithCategory = Doc<"listItems"> & {
  category: Doc<"categories"> | null;
};
export type ListWithItems = Doc<"lists"> & { items: ItemWithCategory[] };

/** Matches the Postgres order: completed asc, name asc, id asc. */
function compareItems(a: ItemWithCategory, b: ItemWithCategory) {
  if (a.completed && !b.completed) return 1;
  if (!a.completed && b.completed) return -1;
  const byName = a.name.localeCompare(b.name);
  return byName !== 0 ? byName : a._id.localeCompare(b._id);
}

/** Join a list with its items (+ each item's category) and sort them. */
export async function loadListWithItems(
  ctx: QueryCtx,
  list: Doc<"lists">,
): Promise<ListWithItems> {
  const items = await ctx.db
    .query("listItems")
    .withIndex("by_list", (q) => q.eq("listId", list._id))
    .collect();
  const withCategory: ItemWithCategory[] = await Promise.all(
    items.map(async (item) => ({
      ...item,
      category: item.categoryId ? await ctx.db.get(item.categoryId) : null,
    })),
  );
  withCategory.sort(compareItems);
  return { ...list, items: withCategory };
}

/**
 * Flatten the items of the given templates (filtered to this project) into
 * insert-ready rows, re-resolving each item's stored category id within the
 * project. Mirrors createList's template seeding.
 */
export async function instantiateTemplateItems(
  ctx: QueryCtx,
  projectId: Id<"projects">,
  templateIds: Id<"listTemplates">[],
): Promise<{ name: string; categoryId: Id<"categories"> | undefined }[]> {
  const result: { name: string; categoryId: Id<"categories"> | undefined }[] =
    [];
  for (const templateId of templateIds) {
    const template = await ctx.db.get(templateId);
    if (template === null || template.projectId !== projectId) {
      continue;
    }
    for (const item of template.items) {
      const normalized = item.category
        ? ctx.db.normalizeId("categories", item.category)
        : null;
      const categoryId = normalized
        ? await resolveProjectCategoryId(ctx, projectId, normalized)
        : undefined;
      result.push({ name: item.name, categoryId });
    }
  }
  return result;
}
