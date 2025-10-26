"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { captureException } from "@sentry/nextjs";
import { Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLogger } from "next-axiom";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
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
import ModalForm from "@/components/ui/modal-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSpending } from "./actions";
import { spendingSchema } from "./data";

export default function CreateSpendingButton() {
  const session = useSession();
  const form = useForm<v.InferInput<typeof spendingSchema>>({
    defaultValues: {
      amount: 0,
      from: session?.data?.user.id,
      to: undefined,
      description: "",
    },
    resolver: valibotResolver(spendingSchema),
  });
  const { project } = useProjects();
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const log = useLogger();

  async function onSubmit(data: v.InferInput<typeof spendingSchema>) {
    try {
      await createSpending(project!.id, data);
      toast.success("Despesa creada");
      triggerRef.current?.click();
      form.reset();
    } catch (e) {
      captureException(e);
      log.error("Error creating spending", {
        error: e,
        projectId: project!.id,
      });
      toast.error("No s'ha pogut crear la despesa, torna-ho a provar més tard");
    }
  }

  return (
    <>
      <Button
        size="sm"
        className="gap-2"
        onClick={() => triggerRef.current?.click()}
      >
        <Plus /> Crear despesa
      </Button>

      {project && (
        <ModalForm
          triggerRef={triggerRef}
          title="Crear despesa"
          description="Crear una nova despesa"
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantitat</FormLabel>
                    <div className="flex flex-row items-center gap-4">
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          disabled={form.formState.isSubmitting}
                        />
                      </FormControl>
                      <span>€</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripció</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pagador</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={form.formState.isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un usuari" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {project.users.map((u) => (
                          <SelectItem key={u.user.id} value={u.user.id}>
                            {u.user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destinatari</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={form.formState.isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Repartit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {project.users.map((u) => (
                          <SelectItem key={u.user.id} value={u.user.id}>
                            {u.user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                className="w-full space-x-2"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && (
                  <span className="loading loading-spinner" />
                )}
                Crear
              </Button>
            </form>
          </Form>
        </ModalForm>
      )}
    </>
  );
}
