"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Edit, SaveIcon } from "lucide-react";
import { useSession } from "next-auth/react";
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
import { editProject, removeProjectImage } from "./actions";

const editProjectSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty(), v.trim()),
  color: v.optional(v.string()),
});

export default function EditProjectButton({ project }: { project: Project }) {
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
        <Button variant="ghost" size="icon" aria-label="Editar">
          <Edit />
        </Button>
      }
      title="Editar grup"
      description="Editar el nom, la imatge i el color del grup"
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
  const { close } = useModalForm();
  const watchedColor = form.watch("color");
  const [imageCleared, setImageCleared] = useState(false);

  const onSubmit = useCallback(
    async (data: v.InferInput<typeof editProjectSchema>) => {
      try {
        await editProject(project, data);
        toast.success(`Grup ${data.name} actualitzat`);
        close();
      } catch (e) {
        posthog.captureException(e, {
          distinctId: sessionId,
          action: "edit_project",
          projectId: project.id,
        });
        toast.error("No s'ha pogut editar el grup, torna-ho a provar més tard");
      }
    },
    [project, sessionId, close],
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
          <Label>Imatge del grup</Label>
          <ImageUpload
            endpoint="groupImageUploader"
            headers={{ "x-project-id": project.id }}
            actions={
              !imageCleared && project.image
                ? [
                    {
                      label: "Eliminar imatge",
                      onAction: async () => {
                        await removeProjectImage(project.id);
                      },
                    },
                  ]
                : undefined
            }
            uploadedActions={[
              {
                label: "Eliminar imatge",
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
              <FormLabel>Color</FormLabel>
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
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <SubmitButton
          icon={<SaveIcon />}
          text="Desar"
          formState={form.formState}
        />
      </form>
    </Form>
  );
}
