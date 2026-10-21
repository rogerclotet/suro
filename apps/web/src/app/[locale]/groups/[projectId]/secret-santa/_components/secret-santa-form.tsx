"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import {
  MIN_PARTICIPANTS,
  type PriceRange,
  priceRangeIsValid,
} from "domain/secret-santa";
import { useTranslations } from "next-intl";
import { type ReactNode, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as v from "valibot";
import type { ProjectMember } from "@/app/_data/project";
import { DateField } from "@/components/ui/date-field";
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
import UserAvatar from "@/components/user-avatar";
import { isUpcomingExchange, type SecretSantaFormValues } from "./form-values";
import { PriceRangeText } from "./price-range-text";

const DEFAULT_SLIDER_MAX = 50;

type Translate = ReturnType<typeof useTranslations<"secretSanta">>;

function formSchema(t: Translate, requireUpcoming: boolean) {
  return v.pipe(
    v.object({
      name: v.pipe(v.string(), v.trim(), v.nonEmpty(t("validationName"))),
      description: v.string(),
      date: v.date(),
      allDay: v.boolean(),
      time: v.string(),
      priceRange: v.pipe(
        v.object({ min: v.number(), max: v.number() }),
        v.check(priceRangeIsValid, t("validationPriceMinMax")),
      ),
      participantIds: v.pipe(
        v.array(v.string()),
        v.minLength(MIN_PARTICIPANTS, t("validationMinParticipants")),
      ),
    }),
    v.forward(
      v.check(
        (values) => !requireUpcoming || isUpcomingExchange(values),
        t("validationFutureDate"),
      ),
      ["date"],
    ),
  );
}

export default function SecretSantaForm({
  initialValues,
  members,
  participantsLocked = false,
  requireUpcoming = false,
  submitText,
  submitIcon,
  onSubmit,
}: {
  initialValues: SecretSantaFormValues;
  members: ProjectMember[];
  participantsLocked?: boolean;
  requireUpcoming?: boolean;
  submitText: string;
  submitIcon: ReactNode;
  onSubmit: (values: SecretSantaFormValues) => Promise<void>;
}) {
  const t = useTranslations("secretSanta");
  const tCommon = useTranslations("common");
  const schema = useMemo(
    () => formSchema(t, requireUpcoming),
    [t, requireUpcoming],
  );
  const form = useForm<SecretSantaFormValues>({
    defaultValues: initialValues,
    resolver: valibotResolver(schema),
    mode: "onChange",
  });
  const [sliderMax, setSliderMax] = useState(
    Math.max(DEFAULT_SLIDER_MAX, initialValues.priceRange.max * 2),
  );
  const allDay = form.watch("allDay");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="secret-santa-name">
                {tCommon("name")}
              </FieldLabel>
              <FieldContent>
                <Input
                  id="secret-santa-name"
                  {...field}
                  aria-invalid={fieldState.invalid}
                />
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
              <FieldLabel htmlFor="secret-santa-description">
                {tCommon("description")}
              </FieldLabel>
              <FieldContent>
                <Textarea id="secret-santa-description" {...field} />
              </FieldContent>
            </Field>
          )}
        />

        <div className="flex flex-row flex-wrap items-end gap-2">
          <Controller
            name="date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="grow">
                <FieldLabel>{t("dateLabel")}</FieldLabel>
                <FieldContent>
                  <DateField
                    value={field.value}
                    onChange={(date) => {
                      if (date) field.onChange(date);
                    }}
                    placeholder={t("dateLabel")}
                    clearable={false}
                  />
                  <FieldError errors={[fieldState.error]} />
                </FieldContent>
              </Field>
            )}
          />
          {!allDay && (
            <Controller
              name="time"
              control={form.control}
              render={({ field }) => (
                <Field className="w-auto">
                  <FieldLabel htmlFor="secret-santa-time">
                    {t("timeLabel")}
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="secret-santa-time"
                      type="time"
                      className="justify-center"
                      {...field}
                    />
                  </FieldContent>
                </Field>
              )}
            />
          )}
        </div>

        <Controller
          name="allDay"
          control={form.control}
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Switch
                id="secret-santa-all-day"
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  void form.trigger("date");
                }}
              />
              <Label htmlFor="secret-santa-all-day">{t("allDayLabel")}</Label>
            </div>
          )}
        />

        <Controller
          name="priceRange"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>{t("priceRangeLabel")}</FieldLabel>
              <FieldDescription>
                <PriceRangeText priceRange={field.value} showHidden />
              </FieldDescription>
              <FieldContent>
                <Slider
                  min={0}
                  max={sliderMax}
                  step={1}
                  value={[field.value.min, field.value.max]}
                  onValueChange={([min = 0, max = 0]: number[]) =>
                    field.onChange({ min, max } satisfies PriceRange)
                  }
                  onValueCommit={() => {
                    // Grow the scale when the budget nears its end.
                    if (field.value.max > sliderMax * 0.7) {
                      setSliderMax(field.value.max * 2);
                    }
                  }}
                />
                <FieldError errors={[fieldState.error]} />
              </FieldContent>
            </Field>
          )}
        />
      </FieldGroup>

      <FieldSeparator />

      <Controller
        name="participantIds"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>{t("participants")}</FieldLabel>
            {participantsLocked && (
              <FieldDescription>{t("participantsLocked")}</FieldDescription>
            )}
            <FieldContent>
              {members.map(({ user }) => (
                <div key={user.id} className="flex items-center gap-2">
                  <Switch
                    id={`participant-${user.id}`}
                    checked={field.value.includes(user.id)}
                    disabled={participantsLocked}
                    onCheckedChange={(checked) =>
                      field.onChange(
                        checked
                          ? [...field.value, user.id]
                          : field.value.filter((id) => id !== user.id),
                      )
                    }
                  />
                  <UserAvatar user={user} className="h-6 w-6 text-xs" />
                  <Label htmlFor={`participant-${user.id}`}>{user.name}</Label>
                </div>
              ))}
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
