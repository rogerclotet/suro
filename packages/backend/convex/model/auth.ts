import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx } from "../_generated/server";

/** Current authenticated user id, or throw. Ported from requireSession. */
export async function requireUserId(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("Not logged in");
  }
  return userId;
}
