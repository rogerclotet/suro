// @ts-check
/**
 * One-off Postgres → Convex data migration. Reads the source Postgres directly
 * and writes through the guarded `migrations.*` mutations.
 *
 * Run once near cutover (idempotent — safe to re-run):
 *
 *   # On the Convex deployment:
 *   npx convex env set MIGRATION_SECRET "<a long random string>"
 *
 *   # Then locally, with the source DB reachable:
 *   CONVEX_URL="https://<deployment>.convex.cloud" \
 *   SOURCE_DATABASE_URL="postgres://…" \
 *   MIGRATION_SECRET="<same string>" \
 *   node scripts/migrate.mjs
 *
 * Migrates in FK order and remaps every foreign key (including the category ids
 * embedded in template item JSON and `lists.eventId`) from Postgres ids to
 * Convex ids.
 *
 * Users are seeded by email with NO auth account — Convex Auth links to them on
 * first sign-in, so existing logins keep their groups. Verify with a real
 * account before cutover (highest-risk step).
 */
import { ConvexHttpClient } from "convex/browser";
import postgres from "postgres";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = required("CONVEX_URL");
const SOURCE_DATABASE_URL = required("SOURCE_DATABASE_URL");
const secret = required("MIGRATION_SECRET");

/** @param {string} name */
function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

/** @param {unknown} value */
function toMs(value) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

const convex = new ConvexHttpClient(CONVEX_URL);
const sql = postgres(SOURCE_DATABASE_URL, { max: 1 });

const counts = {
  users: 0,
  projects: 0,
  members: 0,
  categories: 0,
  templates: 0,
  events: 0,
  lists: 0,
  items: 0,
};

try {
  /** @type {Map<string, string>} */
  const users = new Map();
  for (const u of await sql`
    SELECT id, name, email, image, "customImage", "avatarColor",
           "dateLocale", locale, "onboardingCompleted"
    FROM "f_user"`) {
    const id = await convex.mutation(api.migrations.upsertUser, {
      secret,
      legacyId: u.id,
      email: u.email,
      name: u.name ?? undefined,
      image: u.image ?? undefined,
      customImage: u.customImage ?? undefined,
      avatarColor: u.avatarColor ?? undefined,
      dateLocale: u.dateLocale ?? undefined,
      locale: u.locale ?? undefined,
      onboardingCompleted: u.onboardingCompleted ?? undefined,
    });
    users.set(u.id, id);
    counts.users++;
  }

  /** @type {Map<string, string>} */
  const projects = new Map();
  for (const p of await sql`
    SELECT id, name, "createdBy", "inviteToken", "inviteTokenExpiresAt",
           image, color, features
    FROM "f_project"`) {
    const createdBy = users.get(p.createdBy);
    if (!createdBy) continue;
    const id = await convex.mutation(api.migrations.upsertProject, {
      secret,
      legacyId: p.id,
      name: p.name,
      createdBy,
      inviteToken: String(p.inviteToken),
      inviteTokenExpiresAt: toMs(p.inviteTokenExpiresAt),
      image: p.image ?? undefined,
      color: p.color,
      features: p.features ?? { secretSanta: false },
    });
    projects.set(p.id, id);
    counts.projects++;
  }

  for (const m of await sql`
    SELECT "projectId", "userId" FROM "f_projectToUser"`) {
    const projectId = projects.get(m.projectId);
    const userId = users.get(m.userId);
    if (!projectId || !userId) continue;
    await convex.mutation(api.migrations.addMember, {
      secret,
      projectId,
      userId,
    });
    counts.members++;
  }

  /** @type {Map<string, string>} */
  const categories = new Map();
  for (const c of await sql`SELECT id, name, "projectId" FROM "f_category"`) {
    const projectId = projects.get(c.projectId);
    if (!projectId) continue;
    const id = await convex.mutation(api.migrations.upsertCategory, {
      secret,
      legacyId: c.id,
      name: c.name,
      projectId,
    });
    categories.set(c.id, id);
    counts.categories++;
  }

  for (const tpl of await sql`
    SELECT id, name, description, items, "projectId", "createdBy", "updatedAt"
    FROM "f_listTemplate"`) {
    const projectId = projects.get(tpl.projectId);
    const createdBy = users.get(tpl.createdBy);
    if (!projectId || !createdBy) continue;
    const rawItems = Array.isArray(tpl.items) ? tpl.items : [];
    await convex.mutation(api.migrations.upsertTemplate, {
      secret,
      legacyId: tpl.id,
      name: tpl.name,
      description: tpl.description ?? undefined,
      // Remap each embedded category id (Postgres → Convex); drop if gone.
      items: rawItems.map((item) => ({
        name: item.name,
        category: item.category
          ? (categories.get(item.category) ?? null)
          : null,
      })),
      projectId,
      createdBy,
      updatedAt: toMs(tpl.updatedAt) ?? Date.now(),
    });
    counts.templates++;
  }

  // Events before lists, so lists.eventId can be remapped to a Convex id.
  /** @type {Map<string, string>} */
  const events = new Map();
  for (const e of await sql`
    SELECT id, name, description, "startAt", "endAt", "allDay", "projectId",
           "createdBy", "updatedBy", "updatedAt", "createdAt"
    FROM "f_event"`) {
    const projectId = projects.get(e.projectId);
    const createdBy = users.get(e.createdBy);
    const startAt = toMs(e.startAt);
    const endAt = toMs(e.endAt);
    if (
      !projectId ||
      !createdBy ||
      startAt === undefined ||
      endAt === undefined
    )
      continue;
    const id = await convex.mutation(api.migrations.upsertEvent, {
      secret,
      legacyId: e.id,
      name: e.name,
      description: e.description ?? undefined,
      startAt,
      endAt,
      allDay: e.allDay ?? false,
      projectId,
      createdBy,
      updatedBy: e.updatedBy ? users.get(e.updatedBy) : undefined,
      updatedAt: toMs(e.updatedAt) ?? toMs(e.createdAt) ?? Date.now(),
    });
    events.set(e.id, id);
    counts.events++;
  }

  /** @type {Map<string, string>} */
  const lists = new Map();
  for (const l of await sql`
    SELECT id, name, description, "projectId", "eventId", "createdBy",
           "updatedBy", "updatedAt", "createdAt", favorite
    FROM "f_list"`) {
    const projectId = projects.get(l.projectId);
    const createdBy = users.get(l.createdBy);
    if (!projectId || !createdBy) continue;
    const id = await convex.mutation(api.migrations.upsertList, {
      secret,
      legacyId: l.id,
      name: l.name,
      description: l.description ?? "",
      projectId,
      favorite: l.favorite ?? false,
      eventId: l.eventId ? events.get(l.eventId) : undefined,
      createdBy,
      updatedBy: l.updatedBy ? users.get(l.updatedBy) : undefined,
      updatedAt: toMs(l.updatedAt) ?? toMs(l.createdAt) ?? Date.now(),
    });
    lists.set(l.id, id);
    counts.lists++;
  }

  for (const it of await sql`
    SELECT id, name, details, completed, "listId", "categoryId", "createdBy",
           "updatedBy", "updatedAt", "createdAt"
    FROM "f_listItem"`) {
    const listId = lists.get(it.listId);
    const createdBy = users.get(it.createdBy);
    if (!listId || !createdBy) continue;
    await convex.mutation(api.migrations.upsertItem, {
      secret,
      legacyId: it.id,
      name: it.name,
      details: it.details ?? undefined,
      completed: it.completed ?? false,
      listId,
      categoryId: it.categoryId ? categories.get(it.categoryId) : undefined,
      createdBy,
      updatedBy: it.updatedBy ? users.get(it.updatedBy) : undefined,
      updatedAt: toMs(it.updatedAt) ?? toMs(it.createdAt) ?? Date.now(),
    });
    counts.items++;
  }

  console.log("Migration complete:", counts);
} finally {
  await sql.end();
}
