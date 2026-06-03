CREATE TABLE IF NOT EXISTS "f_note" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"contents" text NOT NULL,
	"format" varchar(255) NOT NULL,
	"uploadedBy" varchar(255) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updatedBy" varchar(255),
	"updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"projectId" varchar NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_note" ADD CONSTRAINT "f_note_uploadedBy_f_user_id_fk" FOREIGN KEY ("uploadedBy") REFERENCES "public"."f_user"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_note" ADD CONSTRAINT "f_note_updatedBy_f_user_id_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."f_user"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_note" ADD CONSTRAINT "f_note_projectId_f_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."f_project"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
