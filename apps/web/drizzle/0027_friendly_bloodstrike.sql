ALTER TABLE "f_secretSantaParticipant" DROP CONSTRAINT "f_secretSantaParticipant_assignedTo_f_user_id_fk";
--> statement-breakpoint
ALTER TABLE "f_secretSantaParticipant" ADD CONSTRAINT "assigned_to_participant_fk" FOREIGN KEY ("assignedTo") REFERENCES "public"."f_secretSantaParticipant"("id") ON DELETE no action ON UPDATE no action;