// Preview environment seed: creates the preview user + a shared group project
// with fixture data so the environment is meaningful on first login.
// Safe to run repeatedly — skips each section if it already exists.

import { randomBytes, randomUUID } from "node:crypto";
import postgres from "postgres";

const email = process.env.PREVIEW_AUTH_EMAIL;
if (!email) {
  console.log("PREVIEW_AUTH_EMAIL not set; skipping seed");
  process.exit(0);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set; refusing to seed");
  process.exit(1);
}

// 6-char hex ID matching the app's randomId() helper.
function id() {
  return randomBytes(3).toString("hex");
}

// Date N days from now at a given hour (UTC).
function daysFromNow(n, hour = 12) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

const sql = postgres(url, { max: 1 });
try {
  // ── 1. Preview user ───────────────────────────────────────────────────────
  let previewUserId;
  const [existingUser] = await sql`
    SELECT id FROM "f_user" WHERE email = ${email} LIMIT 1
  `;

  if (existingUser) {
    console.log(`Preview user already exists (${email})`);
    previewUserId = existingUser.id;
  } else {
    previewUserId = randomUUID();
    const personalId = id();
    const baseFeatures = JSON.stringify({ secretSanta: false });

    await sql.begin(async (tx) => {
      await tx`
        INSERT INTO "f_user"
          (id, name, email, "emailVerified", "dateLocale", locale, "onboardingCompleted")
        VALUES
          (${previewUserId}, ${email}, ${email}, NOW(), 'en-US', 'en', true)
      `;
      await tx`
        INSERT INTO "f_project" (id, name, "createdBy", color, features)
        VALUES (${personalId}, 'Personal', ${previewUserId}, '#89b4fa', ${baseFeatures}::jsonb)
      `;
      await tx`
        INSERT INTO "f_projectToUser" ("projectId", "userId")
        VALUES (${personalId}, ${previewUserId})
      `;
    });
    console.log(`Created preview user: ${email}`);
  }

  // ── 2. Group fixtures (idempotent) ────────────────────────────────────────
  const [groupExists] = await sql`
    SELECT p.id FROM "f_project" p
    JOIN "f_projectToUser" ptu ON ptu."projectId" = p.id
    WHERE ptu."userId" = ${previewUserId} AND p.name = 'Weekend Group'
    LIMIT 1
  `;
  if (groupExists) {
    console.log("Group fixtures already seeded; done.");
    process.exit(0);
  }

  const alexId = randomUUID();
  const samId = randomUUID();
  const groupId = id();
  const groupFeatures = JSON.stringify({ secretSanta: true });

  // Event IDs
  const groceryEventId = id();
  const boardGameEventId = id();
  const bbqEventId = id();

  // List IDs
  const groceryListId = id();
  const bbqListId = id();

  // Pot ID
  const potId = id();

  await sql.begin(async (tx) => {
    // ── Users ────────────────────────────────────────────────────────────────
    await tx`
      INSERT INTO "f_user"
        (id, name, email, "emailVerified", "dateLocale", locale, "onboardingCompleted")
      VALUES
        (${alexId},  'Alex Martin',  'alex@preview.test', NOW(), 'en-US', 'en', true),
        (${samId},   'Sam Rivera',   'sam@preview.test',  NOW(), 'en-US', 'en', true)
    `;

    // ── Group project ────────────────────────────────────────────────────────
    await tx`
      INSERT INTO "f_project" (id, name, "createdBy", color, features)
      VALUES (${groupId}, 'Weekend Group', ${previewUserId}, '#a6e3a1', ${groupFeatures}::jsonb)
    `;
    await tx`
      INSERT INTO "f_projectToUser" ("projectId", "userId")
      VALUES
        (${groupId}, ${previewUserId}),
        (${groupId}, ${alexId}),
        (${groupId}, ${samId})
    `;

    // ── Events (3, 5, 7 days from now) ──────────────────────────────────────
    const wed = daysFromNow(3, 10);
    const wedEnd = daysFromNow(3, 11);
    const fri = daysFromNow(5, 19);
    const friEnd = daysFromNow(5, 23);
    const sat = daysFromNow(7, 11);
    const satEnd = daysFromNow(7, 22);

    await tx`
      INSERT INTO "f_event"
        (id, name, description, "startAt", "endAt", "allDay", "createdBy", "projectId")
      VALUES
        (${groceryEventId},  'Grocery Run',      'Pick up everything for the BBQ', ${wed}, ${wedEnd}, false, ${previewUserId}, ${groupId}),
        (${boardGameEventId},'Board Game Night',  'Bring your favorite games!',    ${fri}, ${friEnd}, false, ${previewUserId}, ${groupId}),
        (${bbqEventId},      'BBQ at the Park',   'Meet at the east entrance',     ${sat}, ${satEnd}, true,  ${previewUserId}, ${groupId})
    `;

    // ── Lists ────────────────────────────────────────────────────────────────
    await tx`
      INSERT INTO "f_list" (id, name, description, "createdBy", "projectId", favorite, "eventId")
      VALUES
        (${groceryListId}, 'Weekend Groceries',  'Everything we need for the BBQ', ${previewUserId}, ${groupId}, true,  ${groceryEventId}),
        (${bbqListId},     'BBQ Essentials',      'Gear checklist',                ${alexId},        ${groupId}, false, ${bbqEventId})
    `;

    await tx`
      INSERT INTO "f_listItem" (id, name, completed, "createdBy", "listId")
      VALUES
        (${id()}, 'Beers (2 six-packs)',          true,  ${previewUserId}, ${groceryListId}),
        (${id()}, 'Burger buns',                  false, ${previewUserId}, ${groceryListId}),
        (${id()}, 'Beef patties (1 kg)',           false, ${samId},         ${groceryListId}),
        (${id()}, 'Cheese slices',                true,  ${alexId},        ${groceryListId}),
        (${id()}, 'Lettuce, tomato, onion',       false, ${samId},         ${groceryListId}),
        (${id()}, 'Chips & dips',                 false, ${previewUserId}, ${groceryListId}),
        (${id()}, 'Paper plates & napkins',       true,  ${alexId},        ${groceryListId}),
        (${id()}, 'Condiments (ketchup, mustard)',false,  ${previewUserId}, ${groceryListId})
    `;

    await tx`
      INSERT INTO "f_listItem" (id, name, completed, "createdBy", "listId")
      VALUES
        (${id()}, 'Charcoal grill',        true,  ${alexId},        ${bbqListId}),
        (${id()}, 'Charcoal & lighter',    true,  ${previewUserId}, ${bbqListId}),
        (${id()}, 'Grill tongs & spatula', false, ${alexId},        ${bbqListId}),
        (${id()}, 'Folding table',         false, ${samId},         ${bbqListId}),
        (${id()}, 'Portable speakers',     false, ${previewUserId}, ${bbqListId}),
        (${id()}, 'Sunscreen',             true,  ${samId},         ${bbqListId})
    `;

    // ── Note ─────────────────────────────────────────────────────────────────
    const noteContent = [
      "<h2>Weekend Plan 🎉</h2>",
      "<p>Proper BBQ at the park this weekend. Here's the rundown:</p>",
      "<ul>",
      "  <li><strong>Wednesday</strong> – grocery run (see the list)</li>",
      "  <li><strong>Friday evening</strong> – board game night at Sam's, 7 pm</li>",
      "  <li><strong>Saturday</strong> – BBQ at the east entrance of Riverside Park, all day</li>",
      "</ul>",
      "<h3>Who's bringing what</h3>",
      "<ul>",
      "  <li><strong>Alex</strong> – grill + charcoal</li>",
      "  <li><strong>Sam</strong> – extra chairs, the good speakers</li>",
      "  <li><strong>You</strong> – drinks + condiments</li>",
      "</ul>",
      "<p>Alex will collect money for the grill rental via the expenses pot.</p>",
    ].join("\n");

    await tx`
      INSERT INTO "f_note" (id, name, contents, format, "uploadedBy", "projectId")
      VALUES (${id()}, 'Weekend Plan', ${noteContent}, 'html', ${previewUserId}, ${groupId})
    `;

    // ── Pot + spendings ───────────────────────────────────────────────────────
    await tx`
      INSERT INTO "f_pot" (id, name, "projectId", "createdBy")
      VALUES (${potId}, 'Weekend Expenses', ${groupId}, ${previewUserId})
    `;
    await tx`
      INSERT INTO "f_potToUser" ("potId", "userId")
      VALUES (${potId}, ${previewUserId}), (${potId}, ${alexId}), (${potId}, ${samId})
    `;
    await tx`
      INSERT INTO "f_spending"
        (id, amount, currency, description, "from", "createdBy", "projectId", "potId")
      VALUES
        (${id()}, 4800, 'EUR', 'Beers & soft drinks',      ${previewUserId}, ${previewUserId}, ${groupId}, ${potId}),
        (${id()}, 6200, 'EUR', 'Grill rental + charcoal',  ${alexId},        ${alexId},        ${groupId}, ${potId}),
        (${id()}, 3500, 'EUR', 'Chips, dips & condiments', ${samId},         ${samId},         ${groupId}, ${potId})
    `;
  });

  console.log(
    "Preview fixtures seeded: Weekend Group + 2 users + 3 events + 2 lists + note + pot + spendings",
  );
} finally {
  await sql.end();
}
