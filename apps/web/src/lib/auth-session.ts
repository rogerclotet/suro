import type { Doc } from "backend/convex/_generated/dataModel";

/**
 * NextAuth-compatible session shape, preserved during the Convex Auth migration
 * so existing `auth()` / `useSession()` readers keep working unchanged. Backed by
 * Convex `users.me` via `toSession`.
 */
export type SessionUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  customImage: string | null;
  avatarColor: string | null;
  dateLocale: string | null;
  locale: string | null;
  onboardingCompleted: boolean;
};

export type Session = { user: SessionUser };

/**
 * Build a NextAuth-shaped session from a Convex `users.me` doc. `id` is the
 * legacy Postgres id when present so any not-yet-migrated Drizzle code still
 * resolves; Convex functions identify the caller themselves and never read it.
 */
export function toSession(me: Doc<"users">): Session {
  return {
    user: {
      id: me.legacyId ?? me._id,
      name: me.name ?? null,
      email: me.email ?? null,
      image: me.customImage ?? me.image ?? null,
      customImage: me.customImage ?? null,
      avatarColor: me.avatarColor ?? null,
      dateLocale: me.dateLocale ?? null,
      locale: me.locale ?? null,
      onboardingCompleted: me.onboardingCompleted ?? false,
    },
  };
}
