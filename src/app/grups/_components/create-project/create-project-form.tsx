"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { PlusIcon } from "lucide-react";
import { useSession } from "next-auth/react";
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
import { createProject } from "./actions";
import { projectSchema } from "./data";

export default function CreateProjectForm({
  trigger,
}: {
  trigger: React.ReactNode;
}) {
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
      title="Crear grup"
      description="Els grups permeten convidar altres usuaris i compartir llistes, calendari i fitxers amb ells"
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
  const { close } = useModalForm();

  async function onSubmit(data: v.InferInput<typeof projectSchema>) {
    try {
      const project = await createProject(data);
      if (!project) {
        throw new Error("Error creating project");
      }
      selectProject(project);
      toast.success(`Grup ${form.getValues().name} creat`);
      form.reset();
      close();
    } catch (e) {
      posthog.captureException(e, {
        distinctId: sessionId,
        action: "create_project",
      });
      toast.error("No s'ha pogut crear el grup, torna-ho a provar més tard");
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
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <SubmitButton
          icon={<PlusIcon />}
          text="Crear"
          formState={form.formState}
        />
      </form>
    </Form>
  );
}
