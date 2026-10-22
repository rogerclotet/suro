"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { parseGiftUrl } from "domain/secret-santa";
import { Link2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as v from "valibot";
import { secretSantaErrorMessage } from "@/app/[locale]/groups/[projectId]/secret-santa/_components/errors";
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
import { captureException } from "@/lib/error-reporting";

export type GiftIdeaValues = { name: string; description: string; url: string };

export default function GiftIdeaForm({
  initialValues,
  submitText,
  submitIcon,
  errorText,
  onSubmit,
}: {
  initialValues: GiftIdeaValues;
  submitText: string;
  submitIcon: ReactNode;
  errorText: string;
  onSubmit: (values: GiftIdeaValues) => Promise<void>;
}) {
  const t = useTranslations("secretSanta");
  const tCommon = useTranslations("common");
  const { close } = useModalForm();
  const schema = useMemo(
    () =>
      v.object({
        name: v.pipe(v.string(), v.trim(), v.nonEmpty(t("validationName"))),
        description: v.string(),
        url: v.pipe(
          v.string(),
          v.check((url) => parseGiftUrl(url).valid, t("validationInvalidUrl")),
        ),
      }),
    [t],
  );
  const form = useForm<GiftIdeaValues>({
    defaultValues: initialValues,
    resolver: valibotResolver(schema),
    // A link passes through invalid states while typed ("amaz"), so fields
    // are judged once left, then live.
    mode: "onTouched",
  });

  async function handleSubmit(values: GiftIdeaValues) {
    try {
      await onSubmit(values);
      form.reset(initialValues);
      close();
    } catch (error) {
      const message = secretSantaErrorMessage(error, t);
      if (message === null) {
        captureException(error, { action: "save_gift_idea" });
      }
      toast.error(message ?? errorText);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="gift-idea-name">{tCommon("name")}</FieldLabel>
            <FieldContent>
              <Input id="gift-idea-name" autoFocus {...field} />
              <FieldError errors={[fieldState.error]} />
            </FieldContent>
          </Field>
        )}
      />

      <Controller
        name="description"
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor="gift-idea-description">
              {tCommon("description")}
            </FieldLabel>
            <FieldContent>
              <Textarea id="gift-idea-description" {...field} />
            </FieldContent>
          </Field>
        )}
      />

      <Controller
        name="url"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="gift-idea-url">{tCommon("link")}</FieldLabel>
            <FieldContent>
              <InputGroup>
                <InputGroupInput
                  id="gift-idea-url"
                  inputMode="url"
                  placeholder={t("ideasUrlPlaceholder")}
                  {...field}
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
        icon={submitIcon}
        text={submitText}
        formState={form.formState}
      />
    </form>
  );
}
