ALTER TABLE "f_note" ADD COLUMN "eventId" varchar;--> statement-breakpoint
ALTER TABLE "f_pot" ADD COLUMN "eventId" varchar;--> statement-breakpoint
ALTER TABLE "f_note" ADD CONSTRAINT "f_note_eventId_f_event_id_fk" FOREIGN KEY ("eventId") REFERENCES "public"."f_event"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "f_pot" ADD CONSTRAINT "f_pot_eventId_f_event_id_fk" FOREIGN KEY ("eventId") REFERENCES "public"."f_event"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "note_eventId_idx" ON "f_note" USING btree ("eventId");--> statement-breakpoint
CREATE INDEX "pot_eventId_idx" ON "f_pot" USING btree ("eventId");