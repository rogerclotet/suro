CREATE TABLE "f_notificationRead" (
	"notificationId" varchar(255) NOT NULL,
	"userId" varchar(255) NOT NULL,
	"readAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "f_notificationRead_notificationId_userId_pk" PRIMARY KEY("notificationId","userId")
);
--> statement-breakpoint
CREATE TABLE "f_notification" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255),
	"body" text NOT NULL,
	"path" varchar(512),
	"section" varchar(50) NOT NULL,
	"image" varchar(512),
	"projectId" varchar(255) NOT NULL,
	"createdBy" varchar(255) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "f_notificationRead" ADD CONSTRAINT "f_notificationRead_notificationId_f_notification_id_fk" FOREIGN KEY ("notificationId") REFERENCES "public"."f_notification"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "f_notificationRead" ADD CONSTRAINT "f_notificationRead_userId_f_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."f_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "f_notification" ADD CONSTRAINT "f_notification_projectId_f_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."f_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "f_notification" ADD CONSTRAINT "f_notification_createdBy_f_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."f_user"("id") ON DELETE no action ON UPDATE cascade;