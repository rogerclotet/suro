DO $$ BEGIN
 ALTER TABLE "f_account" ADD CONSTRAINT "f_account_userId_f_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."f_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_category" ADD CONSTRAINT "f_category_projectId_f_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."f_project"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_event" ADD CONSTRAINT "f_event_createdBy_f_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."f_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_event" ADD CONSTRAINT "f_event_updatedBy_f_user_id_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."f_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_event" ADD CONSTRAINT "f_event_projectId_f_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."f_project"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
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
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_listItem" ADD CONSTRAINT "f_listItem_createdBy_f_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."f_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_listItem" ADD CONSTRAINT "f_listItem_updatedBy_f_user_id_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."f_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_listItem" ADD CONSTRAINT "f_listItem_listId_f_list_id_fk" FOREIGN KEY ("listId") REFERENCES "public"."f_list"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_listItem" ADD CONSTRAINT "f_listItem_categoryId_f_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."f_category"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_list" ADD CONSTRAINT "f_list_createdBy_f_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."f_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_list" ADD CONSTRAINT "f_list_updatedBy_f_user_id_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."f_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_list" ADD CONSTRAINT "f_list_projectId_f_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."f_project"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_list" ADD CONSTRAINT "f_list_eventId_f_event_id_fk" FOREIGN KEY ("eventId") REFERENCES "public"."f_event"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_projectToUser" ADD CONSTRAINT "f_projectToUser_projectId_f_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."f_project"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_projectToUser" ADD CONSTRAINT "f_projectToUser_userId_f_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."f_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_project" ADD CONSTRAINT "f_project_createdBy_f_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."f_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_session" ADD CONSTRAINT "f_session_userId_f_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."f_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
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
