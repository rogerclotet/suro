ALTER TABLE "f_list" ADD COLUMN "projectId" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_list" ADD CONSTRAINT "f_list_projectId_f_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."f_project"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
