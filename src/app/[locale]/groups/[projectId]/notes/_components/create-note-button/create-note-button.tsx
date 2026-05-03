"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Plus, PlusIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
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
import SubmitButton from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import { createNoteOffline } from "@/lib/offline/offline-notes";
import { noteSchema } from "./schema";

export default function CreateNoteButton({ projectId }: { projectId: string }) {
  const form = useForm({
    defaultValues: {
      name: "",
      contents: "",
    },
    resolver: valibotResolver(noteSchema),
  });
  const { project } = useProjects();
  const { data: session } = useSession();
  const t = useTranslations("notes");

  return (
    <ModalForm
      trigger={
        <Button variant="default" size="sm" className="gap-2">
          <Plus />
          {t("createTitle")}
        </Button>
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

  async function onSubmit(data: v.InferInput<typeof noteSchema>) {
    if (!project) {
      toast.error(tLists("noProjectSelected"));
      return;
    }

    try {
      const noteId = await createNoteOffline(project, {
        name: data.name,
        contents: data.contents,
        format: "text",
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
                <Textarea {...field} />
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
