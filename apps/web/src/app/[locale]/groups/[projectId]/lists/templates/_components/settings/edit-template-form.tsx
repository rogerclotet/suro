"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { SaveIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { Template } from "@/app/_data/list";
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
import ModalForm from "@/components/ui/modal-form";
import SubmitButton from "@/components/ui/submit-button";
import { useSession } from "@/lib/session";
import { templateSchema } from "../create-template/data";

export default function EditTemplateForm({
  template,
  trigger,
}: {
  template: Template;
  trigger: ReactNode;
}) {
  const form = useForm({
    defaultValues: {
      name: template.name,
      description: template.description ?? "",
      items: template.items,
    },
    resolver: valibotResolver(templateSchema),
  });
  const { project } = useProjects();
  const { data: session } = useSession();
  const t = useTranslations("templates");
  const tCommon = useTranslations("common");
  const updateTemplate = useMutation(api.templates.update);

  async function onSubmit(data: v.InferInput<typeof templateSchema>) {
    try {
      await updateTemplate({
        templateId: template.id as Id<"listTemplates">,
        name: data.name,
        description: data.description,
        items: data.items,
      });
      toast.success(t("editSuccess", { name: data.name }));
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "update_template",
        projectId: project?.id,
        templateId: template.id,
      });
      toast.error(t("editError"));
    }
  }

  return (
    <ModalForm
      trigger={trigger}
      title={t("editTitle")}
      description={t("editDescription")}
    >
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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tCommon("description")}</FormLabel>
                <FormControl>
                  <Input {...field} />
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
    </ModalForm>
  );
}
