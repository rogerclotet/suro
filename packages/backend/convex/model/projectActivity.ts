import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/** Record an authorized content change in the same transaction, without notifying. */
export async function recordProjectActivity(
  ctx: MutationCtx,
  projectId: Id<"projects">,
) {
  await ctx.db.patch(projectId, { lastActivityAt: Date.now() });
}
