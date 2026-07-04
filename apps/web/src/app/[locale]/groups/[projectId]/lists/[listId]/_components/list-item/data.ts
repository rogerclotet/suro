import type { Id } from "backend/convex/_generated/dataModel";
import * as v from "valibot";
import type { ListItem } from "@/app/_data/list";

/** Repeat presets shown in the UI; map to a recurrence object (interval 1). */
export const RECURRENCE_PRESETS = [
  "none",
  "daily",
  "weekly",
  "monthly",
  "yearly",
] as const;
export type RecurrencePreset = (typeof RECURRENCE_PRESETS)[number];

export const PRIORITIES = ["low", "normal", "high"] as const;

const prioritySchema = v.picklist(PRIORITIES);
const recurrencePresetSchema = v.picklist(RECURRENCE_PRESETS);

export const listItemSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.nonEmpty("No pot estar buit")),
  details: v.optional(v.pipe(v.string(), v.trim())),
  completed: v.boolean(),
  category: v.nullable(v.string()),
  // Task fields below are only surfaced (and submitted) on task-mode lists; on a
  // plain checklist they stay at these defaults and are never sent.
  dueAt: v.nullable(v.date()),
  dueAllDay: v.boolean(),
  assigneeId: v.nullable(v.string()),
  priority: v.nullable(prioritySchema),
  recurrence: recurrencePresetSchema,
});

export type ListItemFormValues = v.InferInput<typeof listItemSchema>;

/** The empty task-field state for a fresh add row (also a reset baseline). */
export const DEFAULT_TASK_FORM_VALUES = {
  dueAt: null,
  // Due dates are date-only, so all-day is always on (there's no time picker).
  dueAllDay: true,
  assigneeId: null,
  // Tasks start at normal priority (the unbadged default); low/high are opt-in.
  priority: "normal",
  recurrence: "none",
} satisfies Pick<
  ListItemFormValues,
  "dueAt" | "dueAllDay" | "assigneeId" | "priority" | "recurrence"
>;

/** Map a repeat preset to the backend recurrence arg (none -> undefined). */
export function recurrenceFromPreset(
  preset: RecurrencePreset,
): { freq: Exclude<RecurrencePreset, "none">; interval: number } | undefined {
  return preset === "none" ? undefined : { freq: preset, interval: 1 };
}

/** Map a stored recurrence back to its UI preset (interval >1 is out of scope). */
export function presetFromRecurrence(
  recurrence: { freq: Exclude<RecurrencePreset, "none"> } | null,
): RecurrencePreset {
  return recurrence?.freq ?? "none";
}

/**
 * The task-field portion of a create/update mutation arg, derived from the form.
 * For an all-day due date we store UTC midnight of the chosen day (a point, per
 * the backend contract); a timed due is sent as its exact instant. Every field
 * is always present (as a value or `undefined`) because the backend clears any
 * omitted field — callers must spread this whole object.
 */
export type TaskMutationArgs = {
  dueAt: number | undefined;
  dueAllDay: boolean | undefined;
  assigneeId: Id<"users"> | undefined;
  priority: "low" | "normal" | "high" | undefined;
  recurrence:
    | { freq: Exclude<RecurrencePreset, "none">; interval: number }
    | undefined;
};

export function taskArgsFromForm(values: {
  dueAt: Date | null;
  assigneeId: string | null;
  priority: "low" | "normal" | "high" | null;
  recurrence: RecurrencePreset;
}): TaskMutationArgs {
  const { dueAt } = values;
  // Due dates are date-only (all-day): store UTC midnight of the chosen day, a
  // point per the backend contract — there's no time component in the UI.
  const dueAtMs =
    dueAt === null
      ? undefined
      : Date.UTC(dueAt.getFullYear(), dueAt.getMonth(), dueAt.getDate());

  return {
    dueAt: dueAtMs,
    dueAllDay: dueAt === null ? undefined : true,
    // The picker exposes member ids as plain strings; cast at this boundary.
    assigneeId: (values.assigneeId ?? undefined) as Id<"users"> | undefined,
    priority: values.priority ?? undefined,
    recurrence: recurrenceFromPreset(values.recurrence),
  };
}

/**
 * The task fields of an existing item, as mutation args. Every `update` call
 * that isn't editing these (the checkbox toggle, the drag-to-recategorize
 * handler) MUST forward them — the backend clears any omitted field. `dueAt` is
 * sent as its exact stored epoch ms (not re-derived), preserving all-day points.
 */
export function taskArgsFromItem(item: ListItem): TaskMutationArgs {
  return {
    dueAt: item.dueAt?.getTime(),
    dueAllDay: item.dueAt === null ? undefined : item.dueAllDay,
    assigneeId: (item.assigneeId ?? undefined) as Id<"users"> | undefined,
    priority: item.priority ?? undefined,
    recurrence: item.recurrence
      ? { freq: item.recurrence.freq, interval: item.recurrence.interval }
      : undefined,
  };
}
