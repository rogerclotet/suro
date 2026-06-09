"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
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
import { createCategory } from "./actions";
import { categorySchema } from "./data";

export default function NewCategoryModal({
  trigger,
  onCreate,
}: {
  trigger: React.ReactNode;
  onCreate?: (categoryId: string) => void;
}) {
  const t = useTranslations("categories");

  return (
    <ModalForm
      trigger={trigger}
      title={t("newTitle")}
      description={t("newDescription")}
    >
      <NewCategoryModalContent onCreate={onCreate} />
    </ModalForm>
  );
}

function NewCategoryModalContent({
  onCreate,
}: {
  onCreate?: (categoryId: string) => void;
}) {
  const { project, addCategory } = useProjects();
  const form = useForm({
    defaultValues: {
      name: "",
    },
    resolver: valibotResolver(categorySchema),
  });
  const { close } = useModalForm();
  const { data: session } = useSession();
  const t = useTranslations("categories");
  const tCommon = useTranslations("common");

  async function onSubmit(data: v.InferInput<typeof categorySchema>) {
    try {
      if (!project) {
        throw new Error("No project selected");
      }

      const categoryId = await createCategory(project, data);
      addCategory({
        id: categoryId,
        name: data.name,
        projectId: project.id,
      });

      form.reset();
      toast.success(t("createSuccess", { name: data.name }));
      onCreate?.(categoryId);
      close();
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "create_category",
        projectId: project?.id,
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
