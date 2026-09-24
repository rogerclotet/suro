import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

type Resource = "lists" | "notes" | "pots";

/** The indexed read and write share a transaction, including concurrent callers. */
export async function requireEventLinkSlot(
  ctx: MutationCtx,
  table: Resource,
  eventId: Id<"events">,
  resource?: {
    _id: Id<Resource>;
    projectId: Id<"projects">;
    eventId?: Id<"events">;
  },
) {
  if (resource?.eventId && resource.eventId !== eventId) {
    throw new ConvexError({
      code: "EVENT_LINK_CONFLICT",
      message: "Resource is already linked to another event",
    });
  }
  const event = await ctx.db.get(eventId);
  if (!event || (resource && resource.projectId !== event.projectId)) {
    throw new ConvexError({
      code: "EVENT_LINK_CONFLICT",
      message: "Resource and event must belong to the same project",
    });
  }
  const linked = await ctx.db
    .query(table)
    .withIndex("by_event", (q) => q.eq("eventId", eventId))
    .collect();
  if (linked.some((row) => row._id !== resource?._id)) {
    throw new ConvexError({
      code: "EVENT_LINK_CONFLICT",
      message: "Event already has a linked resource of this kind",
    });
  }
}
