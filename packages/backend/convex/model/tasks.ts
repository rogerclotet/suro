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

/** High first so it sorts ahead of normal/low in a tie on due date. */
const PRIORITY_RANK: Record<Priority, number> = { high: 0, normal: 1, low: 2 };

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

/**
 * Task-mode item order: open items first, then by due date (no due date last),
 * then priority (high first), then name. Falls back to the same name/id tiebreak
 * as the plain-checklist `compareItems`.
 */
export function compareTaskItems(a: Doc<"listItems">, b: Doc<"listItems">) {
  if (a.completed !== b.completed) return a.completed ? 1 : -1;
  const aDue = a.dueAt ?? Number.POSITIVE_INFINITY;
  const bDue = b.dueAt ?? Number.POSITIVE_INFINITY;
  if (aDue !== bDue) return aDue - bDue;
  const aRank = PRIORITY_RANK[a.priority ?? "normal"];
  const bRank = PRIORITY_RANK[b.priority ?? "normal"];
  if (aRank !== bRank) return aRank - bRank;
  const byName = a.name.localeCompare(b.name);
  return byName !== 0 ? byName : a._id.localeCompare(b._id);
}
