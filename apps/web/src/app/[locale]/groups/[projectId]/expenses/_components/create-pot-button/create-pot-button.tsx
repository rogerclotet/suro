"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { PlusIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import Action from "@/components/action";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useRouter } from "@/i18n/navigation";
import { createPotOffline } from "@/lib/offline/offline-spendings";
import { potSchema } from "./data";

export default function CreatePotButton() {
  const { data: session } = useSession();
  const { project } = useProjects();
  const t = useTranslations("expenses");
  const form = useForm<v.InferInput<typeof potSchema>>({
    defaultValues: {
      name: "",
      memberIds: [],
    },
    resolver: valibotResolver(potSchema),
  });

  return (
    <>
      {project && (
        <ModalForm
          trigger={<Action icon={PlusIcon} label={t("createPotTitle")} />}
          title={t("createPotTitle")}
          description={t("createPotDescription")}
        >
          <CreatePotFormContent
            form={form}
            project={project}
            sessionId={session?.user.id}
          />
        </ModalForm>
      )}
    </>
  );
}

function CreatePotFormContent({
  form,
  project,
  sessionId,
}: {
  form: ReturnType<typeof useForm<v.InferInput<typeof potSchema>>>;
  project: Project;
  sessionId?: string;
}) {
  const { close } = useModalForm();
  const router = useRouter();
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");

  async function onSubmit(data: v.InferInput<typeof potSchema>) {
    try {
      const potId = await createPotOffline(project.id, {
        name: data.name,
        memberIds: data.memberIds,
      });
      form.reset();
      toast.success(t("createPotSuccess"));
      close();
      if (potId) {
        router.push({
          pathname: "/groups/[projectId]/expenses/[potId]",
          params: { projectId: project.id, potId },
        });
      }
    } catch (e) {
      posthog.captureException(e, {
        distinctId: sessionId,
        action: "create_pot",
        projectId: project.id,
      });
      toast.error(t("createPotError"));
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
                <Input
                  {...field}
                  autoFocus
                  placeholder={t("potNamePlaceholder")}
                  disabled={form.formState.isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="memberIds"
          render={() => (
            <FormItem>
              <FormLabel>{tCommon("members")}</FormLabel>
              <div className="space-y-2">
                {project.users.map((u) => (
                  <FormField
                    key={u.user.id}
                    control={form.control}
                    name="memberIds"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(u.user.id)}
                            onCheckedChange={(checked) => {
                              const current = field.value ?? [];
                              field.onChange(
                                checked
                                  ? [...current, u.user.id]
                                  : current.filter(
                                      (id: string) => id !== u.user.id,
                                    ),
                              );
                            }}
                            disabled={form.formState.isSubmitting}
                          />
                        </FormControl>
                        <span className="font-normal text-sm">
                          {u.user.name}
                        </span>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
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
