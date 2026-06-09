"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import Action from "@/components/action";
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
import { RichTextEditor } from "@/components/ui/rich-text-editor-lazy";
import SubmitButton from "@/components/ui/submit-button";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/lib/session";
import { noteSchema } from "./schema";

export default function CreateNoteButton({ projectId }: { projectId: string }) {
  const form = useForm({
    defaultValues: {
      name: "",
      contents: "",
      format: "html",
    },
    resolver: valibotResolver(noteSchema),
  });
  const { project } = useProjects();
  const { data: session } = useSession();
  const t = useTranslations("notes");

  return (
    <ModalForm
      trigger={
        <Action
          label={t("createTitle")}
          icon={PlusIcon}
          pathParts={["notes"]}
        />
      }
      title={t("createTitle")}
      description={t("createDescription")}
    >
      <CreateNoteFormContent
        form={form}
        project={project}
        projectId={projectId}
        sessionId={session?.user.id}
      />
    </ModalForm>
  );
}

function CreateNoteFormContent({
  form,
  project,
  projectId,
  sessionId,
}: {
  form: ReturnType<typeof useForm<v.InferInput<typeof noteSchema>>>;
  project: Project | null;
  projectId: string;
  sessionId?: string;
}) {
  const { close } = useModalForm();
  const router = useRouter();
  const t = useTranslations("notes");
  const tCommon = useTranslations("common");
  const tLists = useTranslations("lists");
  const createNote = useMutation(api.notes.create);

  async function onSubmit(data: v.InferInput<typeof noteSchema>) {
    if (!project) {
      toast.error(tLists("noProjectSelected"));
      return;
    }

    try {
      const noteId = await createNote({
        projectId: project.id as Id<"projects">,
        name: data.name,
        contents: data.contents,
        format: data.format ?? "html",
      });
      toast.success(t("createSuccess", { name: form.getValues().name }));
      form.reset();
      close();
      if (noteId) {
        router.push({
          pathname: "/groups/[projectId]/notes/[noteId]",
          params: { projectId, noteId },
        });
      }
    } catch (e) {
      posthog.captureException(e, {
        distinctId: sessionId,
        action: "create_note",
        projectId,
      });
      toast.error(t("createError"));
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
                <Input autoFocus {...field} />
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
          icon={<PlusIcon />}
          text={tCommon("create")}
          formState={form.formState}
        />
      </form>
    </Form>
  );
}
