CREATE INDEX "event_projectId_idx" ON "f_event" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "event_projectId_startAt_idx" ON "f_event" USING btree ("projectId","startAt");--> statement-breakpoint
CREATE INDEX "file_projectId_idx" ON "f_file" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "file_eventId_idx" ON "f_file" USING btree ("eventId");--> statement-breakpoint
CREATE INDEX "category_projectId_idx" ON "f_category" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "listItem_categoryId_idx" ON "f_listItem" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "list_eventId_idx" ON "f_list" USING btree ("eventId");--> statement-breakpoint
CREATE INDEX "listTemplate_projectId_idx" ON "f_listTemplate" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "note_projectId_idx" ON "f_note" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "potToUser_userId_idx" ON "f_potToUser" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "pot_projectId_idx" ON "f_pot" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "projectToUser_userId_idx" ON "f_projectToUser" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "pushSubscription_userId_idx" ON "f_pushSubscription" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "spending_projectId_idx" ON "f_spending" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "spending_potId_idx" ON "f_spending" USING btree ("potId");--> statement-breakpoint
CREATE INDEX "spending_from_idx" ON "f_spending" USING btree ("from");--> statement-breakpoint
CREATE INDEX "spending_to_idx" ON "f_spending" USING btree ("to");