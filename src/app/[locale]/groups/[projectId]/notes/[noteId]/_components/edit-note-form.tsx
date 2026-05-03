"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { SaveIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { Note } from "@/app/_data/note";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ModalForm, { useModalForm } from "@/components/ui/modal-form";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import SubmitButton from "@/components/ui/submit-button";
import { updateNoteOffline } from "@/lib/offline/offline-notes";
import { noteSchema } from "../../_components/create-note-button/schema";

export default function EditNoteForm({
  note,
  trigger,
}: {
  note: Note;
  trigger: React.ReactNode;
}) {
  const { data: session } = useSession();
  const t = useTranslations("notes");
  const form = useForm<v.InferInput<typeof noteSchema>>({
    defaultValues: {
      name: note.name,
      contents: note.contents,
      format: "html",
    },
    resolver: valibotResolver(noteSchema),
  });

  return (
    <ModalForm
      trigger={trigger}
      title={t("editTitle")}
      description={t("editDescription")}
    >
      <EditNoteFormContent
        form={form}
        note={note}
        sessionId={session?.user.id}
      />
    </ModalForm>
  );
}

function EditNoteFormContent({
  form,
  note,
  sessionId,
}: {
  form: ReturnType<typeof useForm<v.InferInput<typeof noteSchema>>>;
  note: Note;
  sessionId?: string;
}) {
  const { close } = useModalForm();
  const t = useTranslations("notes");
  const tCommon = useTranslations("common");

  async function onSubmit(data: v.InferInput<typeof noteSchema>) {
    try {
      await updateNoteOffline(note, {
        name: data.name,
        contents: data.contents,
        format: data.format ?? "html",
      });
      toast.success(t("editSuccess", { name: data.name }));
      form.reset({
        name: data.name,
        contents: data.contents,
        format: data.format ?? "html",
      });
      close();
    } catch (e) {
      posthog.captureException(e, {
        distinctId: sessionId,
        action: "edit_note",
        projectId: note.projectId,
        noteId: note.id,
      });
      toast.error(t("editError"));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tCommon("name")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contents"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("noteLabel")}</FormLabel>
              <FormControl>
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t("contentsPlaceholder")}
                  ariaLabel={t("noteLabel")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <SubmitButton
          icon={<SaveIcon />}
          text={tCommon("save")}
          formState={form.formState}
        />
      </form>
    </Form>
  );
}
