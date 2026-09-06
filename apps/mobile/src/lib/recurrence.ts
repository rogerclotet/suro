import type { Recurrence } from "domain/tasks";

export { advanceDueAt, type Priority, type Recurrence } from "domain/tasks";

/** The repeat presets the UI offers: "none" clears it, the rest are interval 1. */
export type RepeatPreset = "none" | Recurrence["freq"];

/** Map a preset chip to a recurrence value (or undefined to clear the repeat). */
export function recurrenceForPreset(
  preset: RepeatPreset,
): Recurrence | undefined {
  return preset === "none" ? undefined : { freq: preset, interval: 1 };
}

/** The preset a stored recurrence corresponds to (interval is always 1 here). */
export function presetForRecurrence(
  recurrence: Recurrence | undefined,
): RepeatPreset {
  return recurrence?.freq ?? "none";
}
