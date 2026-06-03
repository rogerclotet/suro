ALTER TABLE "f_account" DROP CONSTRAINT "f_account_userId_f_user_id_fk";
--> statement-breakpoint
ALTER TABLE "f_category" DROP CONSTRAINT "f_category_projectId_f_project_id_fk";
--> statement-breakpoint
ALTER TABLE "f_event" DROP CONSTRAINT "f_event_createdBy_f_user_id_fk";
--> statement-breakpoint
ALTER TABLE "f_event" DROP CONSTRAINT "f_event_updatedBy_f_user_id_fk";
--> statement-breakpoint
ALTER TABLE "f_event" DROP CONSTRAINT "f_event_projectId_f_project_id_fk";
--> statement-breakpoint
ALTER TABLE "f_file" DROP CONSTRAINT "f_file_uploadedBy_f_user_id_fk";
--> statement-breakpoint
ALTER TABLE "f_file" DROP CONSTRAINT "f_file_projectId_f_project_id_fk";
--> statement-breakpoint
ALTER TABLE "f_file" DROP CONSTRAINT "f_file_eventId_f_event_id_fk";
--> statement-breakpoint
ALTER TABLE "f_listItem" DROP CONSTRAINT "f_listItem_createdBy_f_user_id_fk";
--> statement-breakpoint
ALTER TABLE "f_listItem" DROP CONSTRAINT "f_listItem_updatedBy_f_user_id_fk";
--> statement-breakpoint
ALTER TABLE "f_listItem" DROP CONSTRAINT "f_listItem_listId_f_list_id_fk";
--> statement-breakpoint
ALTER TABLE "f_listItem" DROP CONSTRAINT "f_listItem_categoryId_f_category_id_fk";
--> statement-breakpoint
ALTER TABLE "f_list" DROP CONSTRAINT "f_list_createdBy_f_user_id_fk";
--> statement-breakpoint
ALTER TABLE "f_list" DROP CONSTRAINT "f_list_updatedBy_f_user_id_fk";
--> statement-breakpoint
ALTER TABLE "f_list" DROP CONSTRAINT "f_list_projectId_f_project_id_fk";
--> statement-breakpoint
ALTER TABLE "f_list" DROP CONSTRAINT "f_list_eventId_f_event_id_fk";
--> statement-breakpoint
ALTER TABLE "f_projectToUser" DROP CONSTRAINT "f_projectToUser_projectId_f_project_id_fk";
--> statement-breakpoint
ALTER TABLE "f_projectToUser" DROP CONSTRAINT "f_projectToUser_userId_f_user_id_fk";
--> statement-breakpoint
ALTER TABLE "f_project" DROP CONSTRAINT "f_project_createdBy_f_user_id_fk";
--> statement-breakpoint
ALTER TABLE "f_session" DROP CONSTRAINT "f_session_userId_f_user_id_fk";
--> statement-breakpoint
ALTER TABLE "f_listTemplate" DROP CONSTRAINT "f_listTemplate_createdBy_f_user_id_fk";
--> statement-breakpoint
ALTER TABLE "f_listTemplate" DROP CONSTRAINT "f_listTemplate_updatedBy_f_user_id_fk";
--> statement-breakpoint
ALTER TABLE "f_listTemplate" DROP CONSTRAINT "f_listTemplate_projectId_f_project_id_fk";
--> statement-breakpoint
ALTER TABLE "f_category" ALTER COLUMN "id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "f_category" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "f_category" ALTER COLUMN "projectId" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "f_event" ALTER COLUMN "id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "f_event" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "f_event" ALTER COLUMN "projectId" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "f_file" ALTER COLUMN "id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "f_file" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "f_file" ALTER COLUMN "projectId" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "f_file" ALTER COLUMN "eventId" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "f_listItem" ALTER COLUMN "id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "f_listItem" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "f_listItem" ALTER COLUMN "listId" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "f_listItem" ALTER COLUMN "categoryId" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "f_list" ALTER COLUMN "id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "f_list" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "f_list" ALTER COLUMN "projectId" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "f_list" ALTER COLUMN "eventId" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "f_projectToUser" ALTER COLUMN "projectId" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "f_project" ALTER COLUMN "id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "f_project" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "f_listTemplate" ALTER COLUMN "id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "f_listTemplate" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "f_listTemplate" ALTER COLUMN "projectId" SET DATA TYPE varchar;