"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { LinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FormEvent, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { Event } from "@/app/_data/event";
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
import { captureException } from "@/lib/error-reporting";
import { linkEventNoteSchema } from "../../_components/event/data";

export default function LinkNoteForm({
  event,
  trigger,
}: {
  event: Event;
  trigger: React.ReactNode;
}) {
  const t = useTranslations("calendar");
  const form = useForm({
    defaultValues: {
      noteId: "",
    },
    resolver: valibotResolver(linkEventNoteSchema),
  });
  const { isAuthenticated } = useConvexAuth();
  const notes = useQuery(
    api.events.noteLinkCandidates,
    isAuthenticated ? { projectId: event.projectId as Id<"projects"> } : "skip",
  );
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
        captureException(e, { action: "link_event_note" });
        toast.error(t("linkNoteError"));
      }
    },
    [event, t, linkNote],
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
