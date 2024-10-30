CREATE TABLE IF NOT EXISTS "f_pushSubscription" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"subscription" jsonb NOT NULL,
	"userId" varchar(255) NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_pushSubscription" ADD CONSTRAINT "f_pushSubscription_userId_f_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."f_user"("id") ON DELETE no action ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
