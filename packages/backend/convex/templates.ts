import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  requireProjectMember,
  requireTemplateAccess,
} from "./model/permissions";

const templateItem = v.object({
  name: v.string(),
  category: v.union(v.string(), v.null()),
});

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
    return ctx.db.insert("listTemplates", {
      name: trimmed,
      description: (description ?? "").trim() || undefined,
      items,
      projectId,
      createdBy: userId,
      updatedAt: Date.now(),
    });
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
      items,
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
