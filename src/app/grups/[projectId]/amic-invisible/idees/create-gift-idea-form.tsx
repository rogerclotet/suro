"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Link2Icon, PlusIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import type { GiftIdeaData } from "@/app/_data/secret-santa";
import { giftIdeaSchema } from "@/app/_data/secret-santa";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import SubmitButton from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

export default function GiftIdeaForm({
  giftIdea,
  onChange,
}: {
  giftIdea?: GiftIdeaData;
  onChange?: (data: GiftIdeaData) => void;
}) {
  const form = useForm<GiftIdeaData>({
    defaultValues: giftIdea ?? {
      name: "",
      description: "",
      url: "",
    },
    resolver: valibotResolver(giftIdeaSchema),
    mode: "onChange",
  });

  async function onSubmit(data: GiftIdeaData) {
    onChange?.(data);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="name">Nom</FieldLabel>
            <FieldContent>
              <Input id="name" {...field} />
              <FieldError errors={[fieldState.error]} />
            </FieldContent>
          </Field>
        )}
      />

      <Controller
        name="description"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="description">Descripció</FieldLabel>
            <FieldContent>
              <Textarea id="description" {...field} />
              <FieldError errors={[fieldState.error]} />
            </FieldContent>
          </Field>
        )}
      />

      <Controller
        name="url"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="url">Enllaç</FieldLabel>
            <FieldContent>
              <InputGroup>
                <InputGroupInput
                  type="url"
                  id="url"
                  {...field}
                  placeholder="https://www.exemple.cat"
                />
                <InputGroupAddon>
                  <Link2Icon />
                </InputGroupAddon>
              </InputGroup>
              <FieldError errors={[fieldState.error]} />
            </FieldContent>
          </Field>
        )}
      />

      <SubmitButton
        icon={<PlusIcon />}
        text="Crear"
        formState={form.formState}
      />
    </form>
  );
}
