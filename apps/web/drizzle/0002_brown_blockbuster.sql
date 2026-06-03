ALTER TABLE "f_project" ADD COLUMN "createdBy" varchar(255);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_project" ADD CONSTRAINT "f_project_createdBy_f_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."f_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
