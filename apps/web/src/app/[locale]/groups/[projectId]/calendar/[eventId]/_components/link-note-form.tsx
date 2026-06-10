"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { LinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { type FormEvent, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { Event } from "@/app/_data/event";
import { useProjects } from "@/app/_state/project-state";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import ModalForm from "@/components/ui/modal-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SubmitButton from "@/components/ui/submit-button";
import { useSession } from "@/lib/session";
import { linkEventNoteSchema } from "../../_components/event/data";

export default function LinkNoteForm({
  event,
  trigger,
}: {
  event: Event;
  trigger: React.ReactNode;
}) {
  const { data: session } = useSession();
  const t = useTranslations("calendar");
  const form = useForm({
    defaultValues: {
      noteId: "",
    },
    resolver: valibotResolver(linkEventNoteSchema),
  });
  const { project } = useProjects();
  const notesData = useQuery(
    api.notes.listByProject,
    project ? { projectId: project.id as Id<"projects"> } : "skip",
  );
  const notes = notesData?.filter((note) => note.eventId === undefined);
  const linkNote = useMutation(api.events.linkNote);

  const onSubmit = useCallback(
    async (data: v.InferInput<typeof linkEventNoteSchema>) => {
      try {
        await linkNote({
          eventId: event.id as Id<"events">,
          noteId: data.noteId as Id<"notes">,
        });
        toast.success(t("linkNoteSuccess"));
      } catch (e) {
        posthog.captureException(e, {
          distinctId: session?.user.id,
          action: "link_event_note",
          projectId: event.projectId,
          eventId: event.id,
        });
        toast.error(t("linkNoteError"));
      }
    },
    [event, session?.user.id, t, linkNote],
  );

  const handleFormSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      void form.handleSubmit(onSubmit)(e);
    },
    [form, onSubmit],
  );

  return (
    <ModalForm
      trigger={trigger}
      title={t("linkNoteTitle")}
      description={t("linkNoteDescription")}
    >
      <Form {...form}>
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <FormField
            control={form.control}
            name="noteId"
            render={({ field }) => {
              return (
                <FormItem>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger disabled={!notes || notes.length === 0}>
                        <SelectValue
                          placeholder={
                            notes && notes.length > 0
                              ? t("linkNotePlaceholder")
                              : t("linkNoteNoNotes")
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {notes?.map((note) => (
                        <SelectItem key={note._id} value={note._id}>
                          {note.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              );
            }}
          />

          <SubmitButton
            text={t("linkNoteButton")}
            icon={<LinkIcon />}
            formState={form.formState}
          />
        </form>
      </Form>
    </ModalForm>
  );
}
