import { cache } from "react";
import { toSession } from "@/lib/auth-session";
import { fetchMe } from "@/lib/convex/server";

export type { Session, SessionUser } from "@/lib/auth-session";

/**
 * Convex-backed replacement for NextAuth's `auth()`. Returns a NextAuth-shaped
 * session (built from `users.me`) so the existing server call-sites keep working
 * during the migration. Deduped per request via React `cache()`.
 */
export const auth = cache(async () => {
  const me = await fetchMe();
  return me ? toSession(me) : null;
});
