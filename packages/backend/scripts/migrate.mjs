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
 * Convex ids. Covers every user-owned table: users, projects + members,
 * categories, templates, events, lists + items, files, notes, and the expenses
 * triplet (pots + pot members + spendings).
 *
 * Users are seeded by email with NO auth account — Convex Auth links to them on
 * first sign-in, so existing logins keep their groups. Each user's
 * `emailVerified` is mapped to `emailVerificationTime` and the email is
 * lowercased, both required for that link to fire. Verify with a real account
 * before cutover (highest-risk step).
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
  files: 0,
  notes: 0,
  pots: 0,
  potMembers: 0,
  spendings: 0,
};

// Rows dropped because a referenced row didn't migrate (e.g. a deleted creator).
// Tracked + logged so data loss is auditable instead of silent.
const skipped = { ...counts };

/**
 * @param {keyof typeof skipped} table
 * @param {string} id
 * @param {string} reason
 */
function skip(table, id, reason) {
  skipped[table]++;
  console.warn(`Skipping ${table} ${id}: ${reason}`);
}

try {
  // Pre-flight: surface data that would break by-email auth linking before we
  // write anything. Neither is fatal (you may be migrating a test copy), but
  // both must be resolved in production or affected users lose access.
  const [{ count: nullEmails }] = await sql`
    SELECT COUNT(*)::int AS count
    FROM "f_user" WHERE email IS NULL OR email = ''`;
  if (nullEmails > 0) {
    console.warn(
      `⚠️  ${nullEmails} user(s) have no email and will be skipped — Convex Auth links by email.`,
    );
  }
  const dupEmails = await sql`
    SELECT lower(email) AS email, COUNT(*)::int AS count
    FROM "f_user" WHERE email IS NOT NULL AND email <> ''
    GROUP BY lower(email) HAVING COUNT(*) > 1`;
  if (dupEmails.length > 0) {
    console.warn(
      `⚠️  ${dupEmails.length} email(s) collide case-insensitively; these users will clash on sign-in (Convex Auth requires a unique verified email). Merge them before cutover:`,
    );
    for (const d of dupEmails) console.warn(`     ${d.email} (${d.count})`);
  }

  /** @type {Map<string, string>} */
  const users = new Map();
  for (const u of await sql`
    SELECT id, name, email, "emailVerified", image, "customImage", "avatarColor",
           "dateLocale", locale, "onboardingCompleted"
    FROM "f_user"`) {
    if (!u.email) {
      skip("users", u.id, "no email");
      continue;
    }
    const id = await convex.mutation(api.migrations.upsertUser, {
      secret,
      legacyId: u.id,
      email: u.email,
      // Existing users are trusted (they already have groups), so mark the email
      // verified — fall back to now() if the source row somehow lacks a date.
      emailVerificationTime: toMs(u.emailVerified) ?? Date.now(),
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
           image, color
    FROM "f_project"`) {
    const createdBy = users.get(p.createdBy);
    if (!createdBy) {
      skip("projects", p.id, "missing createdBy user");
      continue;
    }
    const id = await convex.mutation(api.migrations.upsertProject, {
      secret,
      legacyId: p.id,
      name: p.name,
      createdBy,
      inviteToken: String(p.inviteToken),
      inviteTokenExpiresAt: toMs(p.inviteTokenExpiresAt),
      image: p.image ?? undefined,
      color: p.color,
    });
    projects.set(p.id, id);
    counts.projects++;
  }

  for (const m of await sql`
    SELECT "projectId", "userId" FROM "f_projectToUser"`) {
    const projectId = projects.get(m.projectId);
    const userId = users.get(m.userId);
    if (!projectId || !userId) {
      skip("members", `${m.projectId}/${m.userId}`, "missing project or user");
      continue;
    }
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
    if (!projectId) {
      skip("categories", c.id, "missing project");
      continue;
    }
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
    if (!projectId || !createdBy) {
      skip("templates", tpl.id, "missing project or creator");
      continue;
    }
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
    ) {
      skip("events", e.id, "missing project, creator, or dates");
      continue;
    }
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
    if (!projectId || !createdBy) {
      skip("lists", l.id, "missing project or creator");
      continue;
    }
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
    if (!listId || !createdBy) {
      skip("items", it.id, "missing list or creator");
      continue;
    }
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

  // Files: copy each blob from Uploadthing into Convex storage, then upsert the
  // row. Re-runs re-upload bytes (upsertFile drops the dup and keeps the
  // existing blob). Files referencing a missing project/uploader are skipped.
  for (const f of await sql`
    SELECT id, name, url, type, size, "projectId", "eventId", "uploadedBy"
    FROM "f_file"`) {
    const projectId = projects.get(f.projectId);
    const uploadedBy = users.get(f.uploadedBy);
    if (!projectId || !uploadedBy) {
      skip("files", f.id, "missing project or uploader");
      continue;
    }

    const download = await fetch(f.url);
    if (!download.ok) {
      skip("files", f.id, `download failed (${download.status}) from ${f.url}`);
      continue;
    }
    const blob = await download.blob();
    // A deleted/expired Uploadthing object can still answer 200 with an empty or
    // HTML body; Convex storage rejects a 0-byte upload with 400. Catch it here
    // so the skip reason names the real cause instead of a bare upload error.
    if (blob.size === 0) {
      skip(
        "files",
        f.id,
        `empty download from ${f.url} (object gone from Uploadthing?)`,
      );
      continue;
    }
    const uploadUrl = await convex.mutation(api.migrations.generateUploadUrl, {
      secret,
    });
    const upload = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": f.type },
      body: blob,
    });
    if (!upload.ok) {
      const serverMessage = await upload.text().catch(() => "");
      skip(
        "files",
        f.id,
        `upload failed (${upload.status}; declared type=${f.type}, downloaded type=${blob.type || "none"}, bytes=${blob.size}) — ${serverMessage.slice(0, 300)}`,
      );
      continue;
    }
    const { storageId } = await upload.json();

    await convex.mutation(api.migrations.upsertFile, {
      secret,
      legacyId: f.id,
      name: f.name,
      storageId,
      type: f.type,
      size: f.size,
      projectId,
      eventId: f.eventId ? events.get(f.eventId) : undefined,
      uploadedBy,
    });
    counts.files++;
  }

  // Notes (after events: notes.eventId → events). The Drizzle `createdBy` field
  // maps to the legacy column "uploadedBy".
  for (const n of await sql`
    SELECT id, name, contents, format, "uploadedBy", "updatedBy",
           "updatedAt", "createdAt", "projectId", "eventId"
    FROM "f_note" ORDER BY "createdAt"`) {
    const projectId = projects.get(n.projectId);
    const createdBy = users.get(n.uploadedBy);
    if (!projectId || !createdBy) {
      skip("notes", n.id, "missing project or creator");
      continue;
    }
    await convex.mutation(api.migrations.upsertNote, {
      secret,
      legacyId: n.id,
      name: n.name,
      contents: n.contents ?? "",
      format: n.format ?? "plain",
      projectId,
      eventId: n.eventId ? events.get(n.eventId) : undefined,
      createdBy,
      updatedBy: n.updatedBy ? users.get(n.updatedBy) : undefined,
      updatedAt: toMs(n.updatedAt) ?? toMs(n.createdAt) ?? Date.now(),
    });
    counts.notes++;
  }

  // Pots before spendings (spendings.potId → pots). Ordered by createdAt so the
  // resulting Convex `_creationTime` also stays chronological.
  /** @type {Map<string, string>} */
  const pots = new Map();
  for (const p of await sql`
    SELECT id, name, "projectId", "settledAt", "createdAt", "createdBy", "eventId"
    FROM "f_pot" ORDER BY "createdAt"`) {
    const projectId = projects.get(p.projectId);
    const createdBy = users.get(p.createdBy);
    if (!projectId || !createdBy) {
      skip("pots", p.id, "missing project or creator");
      continue;
    }
    const id = await convex.mutation(api.migrations.upsertPot, {
      secret,
      legacyId: p.id,
      name: p.name,
      projectId,
      settledAt: toMs(p.settledAt),
      createdAt: toMs(p.createdAt) ?? Date.now(),
      createdBy,
      eventId: p.eventId ? events.get(p.eventId) : undefined,
    });
    pots.set(p.id, id);
    counts.pots++;
  }

  for (const m of await sql`SELECT "potId", "userId" FROM "f_potToUser"`) {
    const potId = pots.get(m.potId);
    const userId = users.get(m.userId);
    if (!potId || !userId) {
      skip("potMembers", `${m.potId}/${m.userId}`, "missing pot or user");
      continue;
    }
    await convex.mutation(api.migrations.addPotMember, {
      secret,
      potId,
      userId,
    });
    counts.potMembers++;
  }

  for (const s of await sql`
    SELECT id, amount, currency, description, "from", "to",
           "createdAt", "createdBy", "projectId", "potId"
    FROM "f_spending" ORDER BY "createdAt"`) {
    const projectId = projects.get(s.projectId);
    const createdBy = users.get(s.createdBy);
    if (!projectId || !createdBy) {
      skip("spendings", s.id, "missing project or creator");
      continue;
    }
    await convex.mutation(api.migrations.upsertSpending, {
      secret,
      legacyId: s.id,
      amount: s.amount,
      currency: s.currency,
      description: s.description ?? undefined,
      // A spending whose pot was skipped degrades to a project-level spending
      // (potId is nullable in the source too) rather than being dropped.
      from: s.from ? users.get(s.from) : undefined,
      to: s.to ? users.get(s.to) : undefined,
      projectId,
      potId: s.potId ? pots.get(s.potId) : undefined,
      createdAt: toMs(s.createdAt) ?? Date.now(),
      createdBy,
    });
    counts.spendings++;
  }

  console.log("Migration complete:", counts);
  const totalSkipped = Object.values(skipped).reduce((a, b) => a + b, 0);
  if (totalSkipped > 0) {
    console.warn(
      `Skipped ${totalSkipped} row(s) due to missing references:`,
      skipped,
    );
  }
} finally {
  await sql.end();
}
