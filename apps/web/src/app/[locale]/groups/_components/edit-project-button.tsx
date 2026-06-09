"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Edit, SaveIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { type FormEvent, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as v from "valibot";
import type { Project } from "@/app/_data/project";
import ColorPicker from "@/components/color-picker";
import ImageUpload from "@/components/image-upload";
import ProjectAvatar from "@/components/project-avatar";
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
import { Label } from "@/components/ui/label";
import ModalForm, { useModalForm } from "@/components/ui/modal-form";
import SubmitButton from "@/components/ui/submit-button";
import type { CatppuccinColor } from "@/lib/catppuccin-colors";
import { useSession } from "@/lib/session";
import { editProject, removeProjectImage } from "./actions";

const editProjectSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty(), v.trim()),
  color: v.optional(v.string()),
});

export default function EditProjectButton({ project }: { project: Project }) {
  const t = useTranslations("groups");
  const tCommon = useTranslations("common");
  const form = useForm<v.InferInput<typeof editProjectSchema>>({
    defaultValues: {
      name: project.name,
      color: project.color,
    },
    resolver: valibotResolver(editProjectSchema),
  });
  const { data: session } = useSession();

  return (
    <ModalForm
      trigger={
        <Button variant="ghost" size="icon" aria-label={tCommon("edit")}>
          <Edit />
        </Button>
      }
      title={t("editTitle")}
      description={t("editDescription")}
    >
      <EditProjectFormContent
        form={form}
        project={project}
        sessionId={session?.user.id}
      />
    </ModalForm>
  );
}

function EditProjectFormContent({
  form,
  project,
  sessionId,
}: {
  form: ReturnType<typeof useForm<v.InferInput<typeof editProjectSchema>>>;
  project: Project;
  sessionId?: string;
}) {
  const t = useTranslations("groups");
  const tCommon = useTranslations("common");
  const { close } = useModalForm();
  const watchedColor = form.watch("color");
  const [imageCleared, setImageCleared] = useState(false);

  const onSubmit = useCallback(
    async (data: v.InferInput<typeof editProjectSchema>) => {
      try {
        await editProject(project, data);
        toast.success(t("editSuccess", { name: data.name }));
        close();
      } catch (e) {
        posthog.captureException(e, {
          distinctId: sessionId,
          action: "edit_project",
          projectId: project.id,
        });
        toast.error(t("editError"));
      }
    },
    [project, sessionId, close, t],
  );

  const handleFormSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      void form.handleSubmit(onSubmit)(e);
    },
    [form, onSubmit],
  );

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label>{t("groupImage")}</Label>
          <ImageUpload
            endpoint="groupImageUploader"
            headers={{ "x-project-id": project.id }}
            actions={
              !imageCleared && project.image
                ? [
                    {
                      label: t("removeImage"),
                      onAction: async () => {
                        await removeProjectImage(project.id);
                      },
                    },
                  ]
                : undefined
            }
            uploadedActions={[
              {
                label: t("removeImage"),
                variant: "destructive" as const,
                onAction: async () => {
                  await removeProjectImage(project.id);
                },
              },
            ]}
            onUploadComplete={() => setImageCleared(false)}
            onActionComplete={() => setImageCleared(true)}
          >
            <ProjectAvatar
              project={{
                ...project,
                image: imageCleared ? null : project.image,
                color: watchedColor ?? project.color,
              }}
              className="h-14 w-14 text-2xl"
            />
          </ImageUpload>
        </div>

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("color")}</FormLabel>
              <FormControl>
                <ColorPicker
                  value={field.value as CatppuccinColor | undefined}
                  onChange={(color) => field.onChange(color)}
                />
              </FormControl>
            </FormItem>
          )}
        />

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

        <SubmitButton
          icon={<SaveIcon />}
          text={tCommon("save")}
          formState={form.formState}
        />
      </form>
    </Form>
  );
}
