import { auth } from "@/auth";

export type { Session, SessionUser } from "@/auth";
export { auth };

/**
 * Back-compat wrapper for the old NextAuth helper; prefer importing `auth` from
 * `@/auth` directly.
 */
export const getServerAuthSession = () => auth();
