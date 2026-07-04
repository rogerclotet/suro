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
import { useProjects } from "@/app/_state/project-state";
import Action from "@/components/action";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ModalForm from "@/components/ui/modal-form";
import SubmitButton from "@/components/ui/submit-button";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "@/i18n/navigation";
import { useProjectTemplates } from "@/lib/queries/use-project-lists";
import { useSession } from "@/lib/session";
import { listSchema } from "./data";

export default function CreateListButton({ projectId }: { projectId: string }) {
  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      templates: [] as string[],
    },
    resolver: valibotResolver(listSchema),
    mode: "onChange",
  });
  const router = useRouter();
  const { project } = useProjects();
  const templates = useProjectTemplates(projectId);
  const createList = useMutation(api.lists.create);
  const { data: session } = useSession();
  const t = useTranslations("lists");
  const tCommon = useTranslations("common");

  async function onSubmit(data: v.InferInput<typeof listSchema>) {
    if (!project) {
      toast.error(t("noProjectSelected"));
      return;
    }

    try {
      const listId = await createList({
        projectId: project.id as Id<"projects">,
        name: data.name,
        description: data.description,
        templateIds: (data.templates ?? []).map(
          (id) => id as Id<"listTemplates">,
        ),
        taskMode: true,
      });
      toast.success(t("createSuccess", { name: form.getValues().name }));
      router.push({
        pathname: "/groups/[projectId]/lists/[listId]",
        params: { projectId, listId },
      });
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "create_list",
        projectId,
      });
      toast.error(t("createError"));
    } finally {
      form.reset();
    }
  }

  if (!project || templates === undefined) {
    return null;
  }

  return (
    <ModalForm
      trigger={
        <Action
          label={t("createTitle")}
          icon={PlusIcon}
          pathParts={["llistes"]}
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
                  <Input {...field} disabled={form.formState.isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {templates.length > 0 && (
            <FormField
              control={form.control}
              name="templates"
              render={() => (
                <FormItem className="space-y-4">
                  <FormLabel>{t("includeTemplates")}</FormLabel>
                  <FormDescription>
                    {t("includeTemplatesDescription")}
                  </FormDescription>

                  <div className="max-h-[20vh] space-y-2 overflow-y-auto">
                    {templates.map((template) => (
                      <FormField
                        key={template.id}
                        control={form.control}
                        name="templates"
                        render={({ field }) => (
                          <FormItem key={template.id}>
                            <div className="flex flex-row items-center gap-2">
                              <FormControl>
                                <Switch
                                  checked={field.value?.includes(template.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...(field.value ?? []),
                                          template.id,
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== template.id,
                                          ),
                                        );
                                  }}
                                  disabled={form.formState.isSubmitting}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {template.name} (
                                {t("templateItemsCount", {
                                  count: template.items.length,
                                })}
                                )
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

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
