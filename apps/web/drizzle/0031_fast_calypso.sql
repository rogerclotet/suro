CREATE TABLE "f_notificationDigest" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"section" varchar(50) NOT NULL,
	"actorName" varchar(255) NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"listId" varchar(255) NOT NULL,
	"listName" varchar(255) NOT NULL,
	"projectId" varchar(255) NOT NULL,
	"createdBy" varchar(255) NOT NULL,
	"sendAfter" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "f_notificationDigest" ADD CONSTRAINT "f_notificationDigest_projectId_f_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."f_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "f_notificationDigest" ADD CONSTRAINT "f_notificationDigest_createdBy_f_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."f_user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "notificationDigest_sendAfter_idx" ON "f_notificationDigest" USING btree ("sendAfter");--> statement-breakpoint
CREATE INDEX "notificationDigest_projectId_idx" ON "f_notificationDigest" USING btree ("projectId");