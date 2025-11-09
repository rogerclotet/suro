"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Plus, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
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
import SubmitButton from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { createNote } from "./actions";
import { noteSchema } from "./schema";

export default function CreateNoteButton({ projectId }: { projectId: string }) {
  const form = useForm({
    defaultValues: {
      name: "",
      contents: "",
    },
    resolver: valibotResolver(noteSchema),
  });
  const { project } = useProjects();
  const { data: session } = useSession();

  return (
    <ModalForm
      trigger={
        <Button variant="default" size="sm" className="gap-2">
          <Plus />
          Crear nota
        </Button>
      }
      title="Crear nota"
      description="Crear una nota nova"
    >
      <CreateNoteFormContent
        form={form}
        project={project}
        projectId={projectId}
        sessionId={session?.user.id}
      />
    </ModalForm>
  );
}

function CreateNoteFormContent({
  form,
  project,
  projectId,
  sessionId,
}: {
  form: ReturnType<typeof useForm<v.InferInput<typeof noteSchema>>>;
  project: Project | null;
  projectId: string;
  sessionId?: string;
}) {
  const { close } = useModalForm();
  const router = useRouter();

  async function onSubmit(data: v.InferInput<typeof noteSchema>) {
    if (!project) {
      toast.error("No s'ha seleccionat cap projecte");
      return;
    }

    try {
      const noteId = await createNote(project, data);
      toast.success(`Nota ${form.getValues().name} creada`);
      form.reset();
      close();
      router.push(`/grups/${projectId}/notes/${noteId}`);
    } catch (e) {
      posthog.captureException(e, {
        distinctId: sessionId,
        action: "create_note",
        projectId,
      });
      toast.error("No s'ha pogut crear la nota, torna-ho a provar més tard");
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

        <FormField
          control={form.control}
          name="contents"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nota</FormLabel>
              <FormControl>
                <Textarea {...field} />
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
