CREATE TABLE IF NOT EXISTS "f_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"projectId" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "f_listItem" ADD COLUMN "categoryId" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_category" ADD CONSTRAINT "f_category_projectId_f_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."f_project"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_listItem" ADD CONSTRAINT "f_listItem_categoryId_f_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."f_category"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
