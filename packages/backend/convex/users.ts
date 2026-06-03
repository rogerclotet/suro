import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

/** The current signed-in user, or null. */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    return ctx.db.get(userId);
  },
});
