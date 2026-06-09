"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
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
import { useSession } from "@/lib/session";
import { createProject } from "./actions";
import { projectSchema } from "./data";

export default function CreateProjectForm({
  trigger,
}: {
  trigger: React.ReactNode;
}) {
  const t = useTranslations("groups");
  const { selectProject } = useProjects();
  const form = useForm({
    defaultValues: {
      name: "",
    },
    resolver: valibotResolver(projectSchema),
  });
  const { data: session } = useSession();

  return (
    <ModalForm
      trigger={trigger}
      title={t("createTitle")}
      description={t("createDescription")}
    >
      <CreateProjectFormContent
        form={form}
        selectProject={selectProject}
        sessionId={session?.user.id}
      />
    </ModalForm>
  );
}

function CreateProjectFormContent({
  form,
  selectProject,
  sessionId,
}: {
  form: ReturnType<typeof useForm<v.InferInput<typeof projectSchema>>>;
  selectProject: (project: Project) => void;
  sessionId?: string;
}) {
  const t = useTranslations("groups");
  const tCommon = useTranslations("common");
  const { close } = useModalForm();

  async function onSubmit(data: v.InferInput<typeof projectSchema>) {
    try {
      const project = await createProject(data);
      if (!project) {
        throw new Error("Error creating project");
      }
      selectProject(project);
      toast.success(t("createSuccess", { name: form.getValues().name }));
      form.reset();
      close();
    } catch (e) {
      posthog.captureException(e, {
        distinctId: sessionId,
        action: "create_project",
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

        <SubmitButton
          icon={<PlusIcon />}
          text={tCommon("create")}
          formState={form.formState}
        />
      </form>
    </Form>
  );
}
