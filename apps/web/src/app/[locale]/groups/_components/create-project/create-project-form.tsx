"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { api } from "backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
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
import { projectSchema } from "./data";

export default function CreateProjectForm({
  trigger,
}: {
  trigger: React.ReactNode;
}) {
  const t = useTranslations("groups");
  const form = useForm({
    defaultValues: {
      name: "",
    },
    resolver: valibotResolver(projectSchema),
  });

  return (
    <ModalForm
      trigger={trigger}
      title={t("createTitle")}
      description={t("createDescription")}
    >
      <CreateProjectFormContent form={form} />
    </ModalForm>
  );
}

function CreateProjectFormContent({
  form,
}: {
  form: ReturnType<typeof useForm<v.InferInput<typeof projectSchema>>>;
}) {
  const t = useTranslations("groups");
  const tCommon = useTranslations("common");
  const { close } = useModalForm();
  const { data: session } = useSession();
  const createProject = useMutation(api.projects.create);

  async function onSubmit(data: v.InferInput<typeof projectSchema>) {
    try {
      const projectId = await createProject({ name: data.name });
      // The projects store updates reactively; persist the selection so its
      // effect makes the new group current once it arrives.
      localStorage.setItem("selectedProjectId", projectId);
      toast.success(t("createSuccess", { name: form.getValues().name }));
      form.reset();
      close();
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
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
