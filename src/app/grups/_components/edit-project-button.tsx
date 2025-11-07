"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Edit } from "lucide-react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { type FormEvent, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { Project } from "@/app/_data/project";
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
import { editProject } from "./actions";
import { projectSchema } from "./create-project/data";

export default function EditProjectButton({ project }: { project: Project }) {
  const form = useForm<v.InferInput<typeof projectSchema>>({
    defaultValues: {
      name: project.name,
    },
    resolver: valibotResolver(projectSchema),
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
      description="Editar el nom del grup"
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
  form: ReturnType<typeof useForm<v.InferInput<typeof projectSchema>>>;
  project: Project;
  sessionId?: string;
}) {
  const { close } = useModalForm();

  const onSubmit = useCallback(
    async (data: v.InferInput<typeof projectSchema>) => {
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

        <Button disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && (
            <span className="loading loading-spinner" />
          )}
          Desar
        </Button>
      </form>
    </Form>
  );
}
