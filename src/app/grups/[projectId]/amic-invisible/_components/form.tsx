"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { PlusIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  type SecretSantaData,
  secretSantaSchema,
} from "@/app/_data/secret-santa";
import { useProjects } from "@/app/_state/project-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import SubmitButton from "@/components/ui/submit-button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_MIN_PRICE = 0;
const DEFAULT_MAX_PRICE = 30;
const DEFAULT_PRICE_RANGE_MAX = 50;

export default function SecretSantaForm({
  initialData,
  onChange,
}: {
  initialData?: SecretSantaData;
  onChange?: (data: SecretSantaData) => Promise<void>;
}) {
  const { data: session } = useSession();
  const { project } = useProjects();
  const form = useForm({
    defaultValues: initialData ?? {
      name: `Amic Invisible ${new Date().getFullYear()}`,
      description: "",
      datetime: new Date(),
      priceRange: {
        min: DEFAULT_MIN_PRICE,
        max: DEFAULT_MAX_PRICE,
      },
      participants: project?.users.map((user) => user.user.id) ?? [],
    },
    resolver: valibotResolver(secretSantaSchema),
    mode: "onChange",
  });
  const [priceRangeMax, setPriceRangeMax] = useState(DEFAULT_PRICE_RANGE_MAX);

  async function onSubmit(data: SecretSantaData) {
    if (!project) {
      posthog.captureException("Project is not defined on secret santa form", {
        distinctId: session?.user.id,
        action: "submit_secret_santa_form",
      });
      return;
    }

    await onChange?.(data);
    form.reset();
  }

  if (!project) {
    return null;
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="name">Nom</FieldLabel>
              <FieldContent>
                <Input id="name" {...field} aria-invalid={fieldState.invalid} />
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
                <Textarea
                  id="description"
                  {...field}
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          name="priceRange"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="priceRange">Rang de preu</FieldLabel>
              <FieldDescription>
                <span>Valor orientatiu pels regals: </span>
                <span>
                  {field.value.min === 0 && field.value.max === 0
                    ? "No es mostrarà"
                    : `${field.value.min}€ - ${field.value.max}€.`}
                </span>
              </FieldDescription>
              <FieldContent>
                <Slider
                  id="priceRange"
                  min={0}
                  max={priceRangeMax}
                  step={1}
                  value={[field.value.min, field.value.max]}
                  onValueChange={(value: number[]) => {
                    field.onChange({
                      min: value[0] ?? 0,
                      max: value[1] ?? 0,
                    });
                  }}
                  onValueCommit={() => {
                    if (field.value.max > priceRangeMax * 0.7) {
                      setPriceRangeMax(field.value.max * 2);
                    }
                  }}
                />
                <FieldError errors={[fieldState.error]} />
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          name="datetime"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="datetime">Data i hora</FieldLabel>
              <FieldContent>
                <Input
                  type="datetime-local"
                  id="datetime"
                  value={field.value.toISOString().slice(0, 16)}
                  onChange={(e) => field.onChange(new Date(e.target.value))}
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </FieldContent>
            </Field>
          )}
        />
      </FieldGroup>

      <FieldSeparator />

      <FieldGroup>
        <Controller
          name="participants"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Participants</FieldLabel>
              <FieldContent>
                {project.users.map((user) => (
                  <div key={user.user.id} className="flex items-center gap-2">
                    <Switch
                      checked={field.value.includes(user.user.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          field.onChange([...field.value, user.user.id]);
                        } else {
                          field.onChange(
                            field.value.filter((id) => id !== user.user.id),
                          );
                        }
                      }}
                    />
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                        {user.user.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                      <AvatarImage src={user.user.image ?? undefined} />
                    </Avatar>
                    <Label htmlFor={user.user.id}>{user.user.name}</Label>
                  </div>
                ))}

                <FieldError errors={[fieldState.error]} />
              </FieldContent>
            </Field>
          )}
        />
      </FieldGroup>

      <SubmitButton
        icon={<PlusIcon />}
        text="Crear"
        formState={form.formState}
      />
    </form>
  );
}
