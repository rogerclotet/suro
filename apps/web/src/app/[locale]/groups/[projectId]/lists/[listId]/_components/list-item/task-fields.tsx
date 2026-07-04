"use client";

import { useTranslations } from "next-intl";
import { type Control, Controller } from "react-hook-form";
import type { ProjectMember } from "@/app/_data/project";
import { DateField } from "@/components/ui/date-field";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { MemberPicker } from "@/components/ui/member-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type ListItemFormValues,
  PRIORITIES,
  RECURRENCE_PRESETS,
} from "./data";

/** Radix Select forbids an empty value, so "normal" is the default priority. */
const DEFAULT_PRIORITY = "normal";

/**
 * The task-only fields (assignee, priority, due date, repeat) shared by the add
 * and edit item forms. Rendered only when the list is in task mode; on a plain
 * checklist it's never mounted, so those lists are unchanged. Due dates are
 * date-only — there's no time or all-day control.
 */
export function TaskFields({
  control,
  members,
  disabled,
}: {
  control: Control<ListItemFormValues>;
  members: ProjectMember[];
  disabled?: boolean;
}) {
  const t = useTranslations("lists");

  return (
    <>
      <Controller
        control={control}
        name="assigneeId"
        render={({ field }) => (
          <Field>
            <FieldLabel>{t("assignee")}</FieldLabel>
            <FieldContent>
              <MemberPicker
                members={members}
                value={field.value}
                onChange={field.onChange}
                disabled={disabled}
              />
            </FieldContent>
          </Field>
        )}
      />

      <Controller
        control={control}
        name="priority"
        render={({ field }) => (
          <Field>
            <FieldLabel>{t("priority")}</FieldLabel>
            <FieldContent>
              <Select
                value={field.value ?? DEFAULT_PRIORITY}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {t(`priority_${priority}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
        )}
      />

      <Controller
        control={control}
        name="dueAt"
        render={({ field }) => (
          <Field>
            <FieldLabel>{t("dueDate")}</FieldLabel>
            <FieldContent>
              <DateField
                value={field.value}
                onChange={field.onChange}
                disabled={disabled}
              />
            </FieldContent>
          </Field>
        )}
      />

      <Controller
        control={control}
        name="recurrence"
        render={({ field }) => (
          <Field>
            <FieldLabel>{t("repeat")}</FieldLabel>
            <FieldContent>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCE_PRESETS.map((preset) => (
                    <SelectItem key={preset} value={preset}>
                      {t(`repeat_${preset}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
        )}
      />
    </>
  );
}
