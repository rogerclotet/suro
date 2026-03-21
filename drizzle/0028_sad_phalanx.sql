CREATE TABLE "f_potToUser" (
	"potId" varchar NOT NULL,
	"userId" varchar(255) NOT NULL,
	CONSTRAINT "f_potToUser_potId_userId_pk" PRIMARY KEY("potId","userId")
);
--> statement-breakpoint
CREATE TABLE "f_pot" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"projectId" varchar NOT NULL,
	"settledAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdBy" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "f_spending" ADD COLUMN "potId" varchar;--> statement-breakpoint
ALTER TABLE "f_potToUser" ADD CONSTRAINT "f_potToUser_potId_f_pot_id_fk" FOREIGN KEY ("potId") REFERENCES "public"."f_pot"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "f_potToUser" ADD CONSTRAINT "f_potToUser_userId_f_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."f_user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "f_pot" ADD CONSTRAINT "f_pot_projectId_f_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."f_project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "f_pot" ADD CONSTRAINT "f_pot_createdBy_f_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."f_user"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "f_spending" ADD CONSTRAINT "f_spending_potId_f_pot_id_fk" FOREIGN KEY ("potId") REFERENCES "public"."f_pot"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
-- Data migration: create a default "General" pot for each project that has spendings
INSERT INTO "f_pot" ("id", "name", "projectId", "createdAt", "createdBy")
SELECT
  substr(md5(random()::text || p."id"), 1, 6),
  'General',
  p."id",
  NOW(),
  p."createdBy"
FROM "f_project" p
WHERE EXISTS (SELECT 1 FROM "f_spending" s WHERE s."projectId" = p."id");--> statement-breakpoint
-- Add all project members as pot members for the default pots
INSERT INTO "f_potToUser" ("potId", "userId")
SELECT pot."id", ptu."userId"
FROM "f_pot" pot
JOIN "f_projectToUser" ptu ON ptu."projectId" = pot."projectId"
WHERE pot."name" = 'General';--> statement-breakpoint
-- Assign all existing spendings to their project's default pot
UPDATE "f_spending" s
SET "potId" = pot."id"
FROM "f_pot" pot
WHERE pot."projectId" = s."projectId"
  AND pot."name" = 'General'
  AND s."potId" IS NULL;