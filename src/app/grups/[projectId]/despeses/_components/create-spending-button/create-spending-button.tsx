"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import ModalForm from "@/components/ui/modal-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Plus } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import type * as v from "valibot";
import { spendingSchema } from "./data";

export default function CreateSpendingButton() {
  const form = useForm<v.InferInput<typeof spendingSchema>>({
    defaultValues: {
      amount: 0,
      from: "",
      to: undefined,
    },
    resolver: valibotResolver(spendingSchema),
  });
  const triggerRef = React.useRef<HTMLDivElement>(null);

  return (
    <>
      <Button
        size="sm"
        className="gap-2"
        onClick={() => triggerRef.current?.click()}
      >
        <Plus /> Crear despesa
      </Button>

      <ModalForm
        triggerRef={triggerRef}
        title="Crear despesa"
        description="Crear una nova despesa"
      >
        <Form {...form}>Encara no està implementat</Form>
      </ModalForm>
    </>
  );
}
