"use client";

import type { File } from "@/app/_data/file";
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
import ModalForm from "@/components/ui/modal-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Edit } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import { editFile } from "./actions";
import { editFileSchema } from "./schema";

export default function EditFileButton({ file }: { file: File }) {
  const form = useForm<v.InferInput<typeof editFileSchema>>({
    defaultValues: {
      name: file.name,
    },
    resolver: valibotResolver(editFileSchema),
  });
  const triggerRef = React.useRef<HTMLDivElement>(null);

  async function onSubmit(data: v.InferInput<typeof editFileSchema>) {
    try {
      await editFile(file, data);
      toast.success("Fitxer editat");
      triggerRef.current?.click();
    } catch (e) {
      console.error(e);
      toast.error("Error editant el fitxer. Torna-ho a provar més tard");
    }
  }

  return (
    <>
      <button
        onClick={() => triggerRef.current?.click()}
        className="text-muted-foreground hover:text-primary"
      >
        <Edit size={16} />
      </button>

      <ModalForm
        triggerRef={triggerRef}
        title="Editar fitxer"
        description="Edita el nom del fitxer"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            <Button className="w-full">Desar</Button>
          </form>
        </Form>
      </ModalForm>
    </>
  );
}
