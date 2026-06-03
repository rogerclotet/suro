CREATE TABLE IF NOT EXISTS "f_spending" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(255) NOT NULL,
	"from" varchar(255),
	"to" varchar(255),
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdBy" varchar(255) NOT NULL,
	"projectId" varchar NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_spending" ADD CONSTRAINT "f_spending_from_f_user_id_fk" FOREIGN KEY ("from") REFERENCES "public"."f_user"("id") ON DELETE no action ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_spending" ADD CONSTRAINT "f_spending_to_f_user_id_fk" FOREIGN KEY ("to") REFERENCES "public"."f_user"("id") ON DELETE no action ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_spending" ADD CONSTRAINT "f_spending_createdBy_f_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."f_user"("id") ON DELETE no action ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f_spending" ADD CONSTRAINT "f_spending_projectId_f_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."f_project"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
