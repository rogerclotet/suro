CREATE TABLE "f_secretSantaParticipant" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"secretSantaId" varchar(255) NOT NULL,
	"assignedTo" varchar(255),
	"giftIdeas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "f_secretSanta" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"projectId" varchar NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"datetime" timestamp with time zone NOT NULL,
	"priceRange" jsonb NOT NULL,
	"exclusions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"assignmentsDone" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"createdBy" varchar(255) NOT NULL,
	"updatedAt" timestamp with time zone,
	"updatedBy" varchar(255)
);
--> statement-breakpoint
ALTER TABLE "f_secretSantaParticipant" ADD CONSTRAINT "f_secretSantaParticipant_userId_f_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."f_user"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "f_secretSantaParticipant" ADD CONSTRAINT "f_secretSantaParticipant_secretSantaId_f_secretSanta_id_fk" FOREIGN KEY ("secretSantaId") REFERENCES "public"."f_secretSanta"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "f_secretSantaParticipant" ADD CONSTRAINT "f_secretSantaParticipant_assignedTo_f_user_id_fk" FOREIGN KEY ("assignedTo") REFERENCES "public"."f_user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "f_secretSanta" ADD CONSTRAINT "f_secretSanta_projectId_f_project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."f_project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "f_secretSanta" ADD CONSTRAINT "f_secretSanta_createdBy_f_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."f_user"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "f_secretSanta" ADD CONSTRAINT "f_secretSanta_updatedBy_f_user_id_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."f_user"("id") ON DELETE no action ON UPDATE cascade;