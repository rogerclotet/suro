import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

/**
 * One-off backfill for the categories rework: copy each item's category *name*
 * onto the item (listItems.category) and clear the legacy FK
 * (listItems.categoryId); rewrite template items' embedded category ids to
 * names. Run once per deployment right after deploying the rework:
 *
 *   pnpm --filter backend exec convex run categoryNamesBackfill:run '{}'
 *   pnpm --filter backend exec convex run categoryNamesBackfill:templates '{}'
 *
 * (add `--prod` for production). Delete this file in the cleanup stage that
 * drops listItems.categoryId from the schema.
 */
export const run = internalMutation({
  args: { cursor: v.optional(v.string()) },
  handler: async (ctx, { cursor }): Promise<null> => {
    const page = await ctx.db
      .query("listItems")
      .paginate({ cursor: cursor ?? null, numItems: 200 });
    for (const item of page.page) {
      if (item.categoryId === undefined) {
        continue;
      }
      const category = await ctx.db.get(item.categoryId);
      // A dangling id degrades to "no category", mirroring the old orphaning.
      await ctx.db.patch(item._id, {
        category: item.category ?? category?.name,
        categoryId: undefined,
      });
    }
    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.categoryNamesBackfill.run, {
        cursor: page.continueCursor,
      });
    }
    return null;
  },
});

export const templates = internalMutation({
  args: {},
  handler: async (ctx): Promise<null> => {
    const allTemplates = await ctx.db.query("listTemplates").collect();
    for (const template of allTemplates) {
      const items = await Promise.all(
        template.items.map(async (item) => {
          if (item.category === null) {
            return item;
          }
          const categoryId = ctx.db.normalizeId("categories", item.category);
          if (categoryId === null) {
            // Already a name (or never an id) — keep as-is.
            return item;
          }
          const category = await ctx.db.get(categoryId);
          const name =
            category && category.projectId === template.projectId
              ? category.name
              : null;
          return { name: item.name, category: name };
        }),
      );
      await ctx.db.patch(template._id, { items });
    }
    return null;
  },
});
