CREATE TABLE IF NOT EXISTS "f_file" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"url" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"size" integer NOT NULL,
	"uploadedBy" varchar(255) NOT NULL,
	"projectId" uuid NOT NULL,
	"eventId" uuid
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_file" ADD CONSTRAINT "f_file_uploadedBy_f_user_id_fk" FOREIGN KEY ("uploadedBy") REFERENCES "public"."f_user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_file" ADD CONSTRAINT "f_file_projectId_f_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."f_project"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_file" ADD CONSTRAINT "f_file_eventId_f_event_id_fk" FOREIGN KEY ("eventId") REFERENCES "public"."f_event"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
