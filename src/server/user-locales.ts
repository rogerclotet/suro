import { inArray } from "drizzle-orm";
import type { routing } from "@/i18n/routing";
import { db } from "./db";
import { users } from "./db/schema";
import { normalizeLocale } from "./notification-i18n";

type Locale = (typeof routing.locales)[number];

export async function getUsersLocaleMap(
  userIds: string[],
): Promise<Map<string, Locale>> {
  if (userIds.length === 0) return new Map();
  const rows = await db.query.users.findMany({
    where: inArray(users.id, userIds),
    columns: { id: true, locale: true },
  });
  return new Map(rows.map((row) => [row.id, normalizeLocale(row.locale)]));
}
