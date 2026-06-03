ALTER TABLE "f_list" DROP CONSTRAINT "f_list_eventId_f_event_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_list" ADD CONSTRAINT "f_list_eventId_f_event_id_fk" FOREIGN KEY ("eventId") REFERENCES "public"."f_event"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
