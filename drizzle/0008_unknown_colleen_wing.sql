CREATE TABLE IF NOT EXISTS "f_listTemplate" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"items" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"createdBy" varchar(255) NOT NULL,
	"updatedAt" timestamp with time zone,
	"updatedBy" varchar(255),
	"projectId" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_listTemplate" ADD CONSTRAINT "f_listTemplate_createdBy_f_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."f_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_listTemplate" ADD CONSTRAINT "f_listTemplate_updatedBy_f_user_id_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."f_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_listTemplate" ADD CONSTRAINT "f_listTemplate_projectId_f_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."f_project"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
