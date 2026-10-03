"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Edit, SaveIcon } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { captureException } from "@/lib/error-reporting";
import { editFileSchema } from "./schema";

export default function EditFileButton({ file }: { file: File }) {
  const form = useForm<v.InferInput<typeof editFileSchema>>({
    defaultValues: {
      name: file.name,
    },
    resolver: valibotResolver(editFileSchema),
  });
  const t = useTranslations("files");

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
      title={t("editTitle")}
      description={t("editDescription")}
    >
      <EditFileFormContent form={form} file={file} />
    </ModalForm>
  );
}

function EditFileFormContent({
  form,
  file,
}: {
  form: ReturnType<typeof useForm<v.InferInput<typeof editFileSchema>>>;
  file: File;
}) {
  const { close } = useModalForm();
  const t = useTranslations("files");
  const tCommon = useTranslations("common");
  const renameFile = useMutation(api.files.rename);

  const onSubmit = useCallback(
    async (data: v.InferInput<typeof editFileSchema>) => {
      try {
        await renameFile({ fileId: file.id as Id<"files">, name: data.name });
        toast.success(t("editSuccess"));
        close();
      } catch (e) {
        captureException(e, { action: "edit_file" });
        toast.error(t("editError"));
      }
    },
    [file, close, t, renameFile],
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
