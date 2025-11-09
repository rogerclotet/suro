"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Edit, SaveIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { type FormEvent, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { File } from "@/app/_data/file";
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
import { editFile } from "./actions";
import { editFileSchema } from "./schema";

export default function EditFileButton({ file }: { file: File }) {
  const form = useForm<v.InferInput<typeof editFileSchema>>({
    defaultValues: {
      name: file.name,
    },
    resolver: valibotResolver(editFileSchema),
  });
  const { data: session } = useSession();

  return (
    <ModalForm
      trigger={
        <button
          type="button"
          className="text-muted-foreground hover:text-primary"
        >
          <Edit size={16} />
        </button>
      }
      title="Editar fitxer"
      description="Edita el nom del fitxer"
    >
      <EditFileFormContent
        form={form}
        file={file}
        sessionId={session?.user.id}
      />
    </ModalForm>
  );
}

function EditFileFormContent({
  form,
  file,
  sessionId,
}: {
  form: ReturnType<typeof useForm<v.InferInput<typeof editFileSchema>>>;
  file: File;
  sessionId?: string;
}) {
  const { close } = useModalForm();

  const onSubmit = useCallback(
    async (data: v.InferInput<typeof editFileSchema>) => {
      try {
        await editFile(file, data);
        toast.success("Fitxer editat");
        close();
      } catch (e) {
        posthog.captureException(e, {
          distinctId: sessionId,
          action: "edit_file",
          projectId: file.project.id,
          eventId: file.eventId,
          fileId: file.id,
        });
        toast.error("Error editant el fitxer. Torna-ho a provar més tard");
      }
    },
    [file, sessionId, close],
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

        <SubmitButton
          icon={<SaveIcon />}
          text="Desar"
          formState={form.formState}
        />
      </form>
    </Form>
  );
}
