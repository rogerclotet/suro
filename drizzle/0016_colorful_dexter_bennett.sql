ALTER TABLE "f_file" DROP CONSTRAINT "f_file_eventId_f_event_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_file" ADD CONSTRAINT "f_file_eventId_f_event_id_fk" FOREIGN KEY ("eventId") REFERENCES "public"."f_event"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
