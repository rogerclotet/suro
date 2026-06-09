"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Link2Icon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { GiftIdeaData } from "@/app/_data/secret-santa";
import { giftIdeaSchema } from "@/app/_data/secret-santa";
import { useProjects } from "@/app/_state/project-state";
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
import { useModalForm } from "@/components/ui/modal-form";
import SubmitButton from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/session";

export default function GiftIdeaForm({
  giftIdea,
  onChange,
}: {
  giftIdea: GiftIdeaData;
  onChange?: (data: GiftIdeaData) => Promise<void>;
}) {
  const form = useForm<GiftIdeaData>({
    defaultValues: giftIdea,
    resolver: valibotResolver(giftIdeaSchema),
    mode: "onChange",
  });
  const { close } = useModalForm();
  const { data: session } = useSession();
  const { project } = useProjects();
  const t = useTranslations("secretSanta");
  const tCommon = useTranslations("common");

  async function onSubmit(data: GiftIdeaData) {
    try {
      await onChange?.(data);
      close();
    } catch (error) {
      posthog.captureException(error, {
        distinctId: session?.user.id,
        action: "create_gift_idea",
        projectId: project?.id,
      });
      toast.error(t("ideaCreateError"));
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="name">{tCommon("name")}</FieldLabel>
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
            <FieldLabel htmlFor="description">
              {tCommon("description")}
            </FieldLabel>
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
            <FieldLabel htmlFor="url">{tCommon("link")}</FieldLabel>
            <FieldContent>
              <InputGroup>
                <InputGroupInput
                  type="url"
                  id="url"
                  {...field}
                  placeholder={t("ideasUrlPlaceholder")}
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
        text={tCommon("create")}
        formState={form.formState}
      />
    </form>
  );
}
