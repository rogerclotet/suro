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
import ModalForm from "@/components/ui/modal-form";
import SubmitButton from "@/components/ui/submit-button";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/lib/session";
import { templateSchema } from "./data";

export default function CreateTemplateButton({
  projectId,
}: {
  projectId: string;
}) {
  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      items: [],
    },
    resolver: valibotResolver(templateSchema),
  });
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations("templates");
  const tCommon = useTranslations("common");
  const createTemplate = useMutation(api.templates.create);

  async function onSubmit(data: v.InferInput<typeof templateSchema>) {
    try {
      const templateId = await createTemplate({
        projectId: projectId as Id<"projects">,
        name: data.name,
        description: data.description,
        items: data.items,
      });
      toast.success(t("createSuccess", { name: form.getValues().name }));
      router.push({
        pathname: "/groups/[projectId]/lists/templates/[templateId]",
        params: { projectId, templateId },
      });
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "create_template",
        projectId,
      });
      toast.error(t("createError"));
      return;
    } finally {
      form.reset();
    }
  }

  return (
    <ModalForm
      trigger={
        <Action
          label={t("createTitle")}
          icon={PlusIcon}
          pathParts={["llistes", "plantilles"]}
        />
      }
      title={t("createTitle")}
      description={t("createDescription")}
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
            icon={<PlusIcon />}
            text={tCommon("create")}
            formState={form.formState}
          />
        </form>
      </Form>
    </ModalForm>
  );
}
