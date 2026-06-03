ALTER TABLE "f_project" ADD COLUMN "image" varchar(512);--> statement-breakpoint
ALTER TABLE "f_project" ADD COLUMN "color" varchar(20) DEFAULT 'blue' NOT NULL;--> statement-breakpoint
ALTER TABLE "f_user" ADD COLUMN "customImage" varchar(512);--> statement-breakpoint
ALTER TABLE "f_user" ADD COLUMN "avatarColor" varchar(20);