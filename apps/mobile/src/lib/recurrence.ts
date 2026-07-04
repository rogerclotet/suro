import type { Doc } from "backend/convex/_generated/dataModel";

/**
 * Recurrence math copied 1:1 from the backend's `model/tasks.ts`
 * (`advanceDueAt` + its helpers). The app can't import backend `model/` code
 * (it isn't part of the generated client surface), so the pure function is
 * duplicated here and kept byte-identical — see `recurrence.test.ts`, which
 * pins the behaviors the backend relies on. Used by the offline overlay to
 * replicate reschedule-on-complete locally, and by the UI's repeat presets.
 *
 * The field types are pulled off the generated `listItems` Doc so they can
 * never drift from the schema's validators.
 */

export type Priority = NonNullable<Doc<"listItems">["priority"]>;
export type Recurrence = NonNullable<Doc<"listItems">["recurrence"]>;

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

/**
 * Advance a recurring task's due date to its next occurrence. Uses UTC calendar
 * math (the app stores due dates as epoch ms with no timezone, and all-day dues
 * are UTC midnight) so monthly/yearly steps keep the same day-of-month and clamp
 * short months (Jan 31 -> Feb 28). Rolls forward past `now` so completing a task
 * late lands on the next *future* occurrence instead of re-opening it overdue.
 */
export function advanceDueAt(
  dueAt: number,
  rule: Recurrence,
  now: number,
): number {
  const interval = Math.max(1, Math.floor(rule.interval));
  let next = stepOccurrence(dueAt, rule.freq, interval);
  // Guard against a pathological loop; ~10k daily steps covers decades.
  for (let i = 0; next <= now && i < 10_000; i++) {
    next = stepOccurrence(next, rule.freq, interval);
  }
  return next;
}

function stepOccurrence(
  dueAt: number,
  freq: Recurrence["freq"],
  interval: number,
): number {
  const d = new Date(dueAt);
  const y = d.getUTCFullYear();
  const mo = d.getUTCMonth();
  const day = d.getUTCDate();
  const h = d.getUTCHours();
  const mi = d.getUTCMinutes();
  const s = d.getUTCSeconds();
  const ms = d.getUTCMilliseconds();
  if (freq === "daily") return Date.UTC(y, mo, day + interval, h, mi, s, ms);
  if (freq === "weekly")
    return Date.UTC(y, mo, day + 7 * interval, h, mi, s, ms);
  if (freq === "monthly") return atMonth(y, mo + interval, day, h, mi, s, ms);
  return atMonth(y + interval, mo, day, h, mi, s, ms); // yearly
}

/**
 * Build a UTC timestamp for a (possibly out-of-range) month, clamping the day to
 * the target month's length so Jan 31 + 1 month -> Feb 28/29 rather than rolling
 * into March.
 */
function atMonth(
  year: number,
  month: number,
  day: number,
  h: number,
  mi: number,
  s: number,
  ms: number,
): number {
  const firstOfTarget = new Date(Date.UTC(year, month, 1));
  const ty = firstOfTarget.getUTCFullYear();
  const tm = firstOfTarget.getUTCMonth();
  // Day 0 of the next month is the last day of the target month.
  const lastDay = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate();
  return Date.UTC(ty, tm, Math.min(day, lastDay), h, mi, s, ms);
}
