import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, query } from "./_generated/server";
import { track } from "./model/analytics";
import {
  ensureCategorySuggestions,
  normalizeCategoryName,
} from "./model/categories";
import {
  requireProjectMember,
  requireTemplateAccess,
} from "./model/permissions";

// `category` is the section name shown in the template, or null.
const templateItem = v.object({
  name: v.string(),
  category: v.union(v.string(), v.null()),
});

/**
 * Normalize item category names and record them as autocomplete suggestions
 * for the project — shared by create/update/exportToProject.
 */
async function prepareTemplateItems(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  items: { name: string; category: string | null }[],
): Promise<{ name: string; category: string | null }[]> {
  const normalized = items.map((item) => ({
    name: item.name,
    category: normalizeCategoryName(item.category) ?? null,
  }));
  await ensureCategorySuggestions(
    ctx,
    projectId,
    normalized.map((item) => item.category),
  );
  return normalized;
}

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    await requireProjectMember(ctx, projectId);
    return ctx.db
      .query("listTemplates")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { templateId: v.id("listTemplates") },
  handler: async (ctx, { templateId }) => {
    const { template } = await requireTemplateAccess(ctx, templateId);
    return template;
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    description: v.optional(v.string()),
    items: v.array(templateItem),
  },
  handler: async (ctx, { projectId, name, description, items }) => {
    const userId = await requireProjectMember(ctx, projectId);
    const trimmed = name.trim();
    if (trimmed === "") {
      throw new Error("Template name is required");
    }
    const templateId = await ctx.db.insert("listTemplates", {
      name: trimmed,
      description: (description ?? "").trim() || undefined,
      items: await prepareTemplateItems(ctx, projectId, items),
      projectId,
      createdBy: userId,
      updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.push.sendToProject, {
      projectId,
      actorId: userId,
      bodyKey: "template_created",
      bodyParams: { name: trimmed },
      path: `/${projectId}/lists/templates`,
    });
    await track(ctx, userId, "template_created", {
      projectId,
      itemCount: items.length,
    });
    return templateId;
  },
});

export const update = mutation({
  args: {
    templateId: v.id("listTemplates"),
    name: v.string(),
    description: v.optional(v.string()),
    items: v.array(templateItem),
  },
  handler: async (ctx, { templateId, name, description, items }) => {
    const { template, userId } = await requireTemplateAccess(ctx, templateId);
    const trimmed = name.trim();
    if (trimmed === "") {
      throw new Error("Template name is required");
    }
    await ctx.db.patch(template._id, {
      name: trimmed,
      description: (description ?? "").trim() || undefined,
      items: await prepareTemplateItems(ctx, template.projectId, items),
      updatedBy: userId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const remove = mutation({
  args: { templateId: v.id("listTemplates") },
  handler: async (ctx, { templateId }) => {
    const { template } = await requireTemplateAccess(ctx, templateId);
    await ctx.db.delete(template._id);
    return null;
  },
});

/**
 * Copy a template into another project the user belongs to (ports exportTemplate).
 * Item category names copy losslessly and are recorded as suggestions in the
 * target project.
 */
export const exportToProject = mutation({
  args: {
    templateId: v.id("listTemplates"),
    targetProjectId: v.id("projects"),
  },
  handler: async (ctx, { templateId, targetProjectId }) => {
    const { template, userId } = await requireTemplateAccess(ctx, templateId);
    await requireProjectMember(ctx, targetProjectId);
    return ctx.db.insert("listTemplates", {
      name: template.name,
      description: template.description,
      items: await prepareTemplateItems(ctx, targetProjectId, template.items),
      projectId: targetProjectId,
      createdBy: userId,
      updatedAt: Date.now(),
    });
  },
});
