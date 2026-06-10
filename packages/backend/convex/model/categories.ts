import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Category names live on the items themselves (list/template "sections"); the
 * `categories` table is only a per-project autocomplete suggestion store.
 * These helpers normalize incoming names and keep that store in sync.
 */

/** Trim the name; empty/null/undefined all mean "no category". */
export function normalizeCategoryName(
  name: string | null | undefined,
): string | undefined {
  const trimmed = name?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Record `name` as an autocomplete suggestion for the project (exact-name
 * dedupe) and return the normalized name to store on the item.
 */
export async function ensureCategorySuggestion(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  name: string | null | undefined,
): Promise<string | undefined> {
  const normalized = normalizeCategoryName(name);
  if (normalized === undefined) {
    return undefined;
  }
  const existing = await ctx.db
    .query("categories")
    .withIndex("by_project_name", (q) =>
      q.eq("projectId", projectId).eq("name", normalized),
    )
    .first();
  if (existing === null) {
    await ctx.db.insert("categories", { name: normalized, projectId });
  }
  return normalized;
}

/** Bulk variant for template saves/instantiation: dedupe, then ensure each. */
export async function ensureCategorySuggestions(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  names: Iterable<string | null | undefined>,
): Promise<void> {
  const unique = new Set<string>();
  for (const name of names) {
    const normalized = normalizeCategoryName(name);
    if (normalized !== undefined) {
      unique.add(normalized);
    }
  }
  for (const name of unique) {
    await ensureCategorySuggestion(ctx, projectId, name);
  }
}

/**
 * Transitional (drop with listItems.categoryId): template items and stale
 * clients from before the rework carry category *ids* where names now live.
 * Map an id to its name when it still belongs to the project; foreign/dangling
 * ids degrade to "no category", mirroring the old resolveProjectCategoryId.
 * Strings that aren't category ids pass through untouched.
 */
export async function resolveLegacyCategoryValue(
  ctx: QueryCtx,
  projectId: Id<"projects">,
  category: string,
): Promise<string | undefined> {
  const normalizedId = ctx.db.normalizeId("categories", category);
  if (normalizedId === null) {
    return category;
  }
  const doc = await ctx.db.get(normalizedId);
  return doc && doc.projectId === projectId ? doc.name : undefined;
}
