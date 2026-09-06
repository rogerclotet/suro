import { compareTasks } from "domain/tasks";

export { advanceDueAt } from "domain/tasks";

import { type Infer, v } from "convex/values";
import type { Doc } from "../_generated/dataModel";

/**
 * The optional task fields that a list item gains when its list is in task mode.
 * Defined here once and imported by both the schema (table columns) and the
 * mutations (arg validators) so the two never drift. Pure helpers (recurrence
 * math, task-mode ordering) live alongside them and stay unit-testable.
 */

export const priorityValidator = v.union(
  v.literal("low"),
  v.literal("normal"),
  v.literal("high"),
);

export const recurrenceValidator = v.object({
  freq: v.union(
    v.literal("daily"),
    v.literal("weekly"),
    v.literal("monthly"),
    v.literal("yearly"),
  ),
  // Repeat every `interval` units of `freq` (>= 1): 1 = daily/weekly/..., 2 =
  // every other, etc.
  interval: v.number(),
});

export type Priority = Infer<typeof priorityValidator>;
export type Recurrence = Infer<typeof recurrenceValidator>;

export function compareTaskItems(a: Doc<"listItems">, b: Doc<"listItems">) {
  return compareTasks({ ...a, id: a._id }, { ...b, id: b._id });
}
