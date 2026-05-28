// Creates the preview user + Personal project so the environment is ready
// immediately after first deploy, without requiring a sign-up flow.
// Skips silently if PREVIEW_AUTH_EMAIL is not set or user already exists.

import { randomUUID } from "node:crypto";
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

const sql = postgres(url, { max: 1 });
try {
  const [existing] = await sql`
    SELECT id FROM "f_user" WHERE email = ${email} LIMIT 1
  `;
  if (existing) {
    console.log(`Preview user already exists (${email}); skipping seed`);
    process.exit(0);
  }

  const userId = randomUUID();
  const projectId = randomUUID();
  const features = JSON.stringify({ secretSanta: false });

  await sql.begin(async (tx) => {
    await tx`
      INSERT INTO "f_user"
        (id, name, email, "emailVerified", "dateLocale", locale, "onboardingCompleted")
      VALUES
        (${userId}, ${email}, ${email}, NOW(), 'en-US', 'en', true)
    `;
    await tx`
      INSERT INTO "f_project" (id, name, "createdBy", color, features)
      VALUES (${projectId}, 'Personal', ${userId}, '#89b4fa', ${features}::jsonb)
    `;
    await tx`
      INSERT INTO "f_projectToUser" ("projectId", "userId")
      VALUES (${projectId}, ${userId})
    `;
  });

  console.log(`Preview seed complete: ${email} (user: ${userId})`);
} finally {
  await sql.end();
}
