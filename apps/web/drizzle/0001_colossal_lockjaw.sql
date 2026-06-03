CREATE TABLE IF NOT EXISTS "f_listItem" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"details" text,
	"completed" boolean DEFAULT false,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"createdBy" varchar(255),
	"updatedAt" timestamp with time zone,
	"updatedBy" varchar(255),
	"listId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "f_list" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"createdBy" varchar(255),
	"updatedAt" timestamp with time zone,
	"updatedBy" varchar(255),
	"description" text
);
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
