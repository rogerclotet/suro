export type Priority = "low" | "normal" | "high";
export type Recurrence = {
  freq: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
};

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

export type TaskOrderItem = {
  id: string;
  name: string;
  completed: boolean;
  dueAt?: number | null;
  priority?: Priority | null;
};

/** Apply an absolute checkbox command to the current occurrence and fields. */
export function completionPatch(
  item: { completed: boolean; dueAt?: number; recurrence?: Recurrence },
  command: { completed: boolean; expectedDueAt: number | null; now: number },
) {
  if (item.completed === command.completed) return null;
  if (command.completed && item.recurrence) {
    // A replay or another member may already have advanced/rescheduled it.
    if ((item.dueAt ?? null) !== command.expectedDueAt) return null;
    return {
      completed: false,
      dueAt: advanceDueAt(
        item.dueAt ?? command.now,
        item.recurrence,
        command.now,
      ),
      reminderSentForDueAt: undefined,
    };
  }
  return { completed: command.completed };
}
const PRIORITY_RANK: Record<Priority, number> = { high: 0, normal: 1, low: 2 };

export function compareTasks(a: TaskOrderItem, b: TaskOrderItem): number {
  if (a.completed !== b.completed) return a.completed ? 1 : -1;
  const aDue = a.dueAt ?? Number.POSITIVE_INFINITY;
  const bDue = b.dueAt ?? Number.POSITIVE_INFINITY;
  if (aDue !== bDue) return aDue - bDue;
  const rank =
    PRIORITY_RANK[a.priority ?? "normal"] -
    PRIORITY_RANK[b.priority ?? "normal"];
  if (rank !== 0) return rank;
  return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
}

export type DueBucket = "overdue" | "today" | "upcoming" | "noDate";

/** The task agenda's sections, in display order. */
export const DUE_BUCKETS: readonly DueBucket[] = [
  "overdue",
  "today",
  "upcoming",
  "noDate",
];

/**
 * Which agenda section a task's due date falls in, against the local day of
 * `now`. All-day dues are stored at UTC midnight (a date, not an instant), so
 * their day comes from the UTC parts; timed dues use the instant's local day.
 */
export function dueBucket(
  task: { dueAt?: number | null; dueAllDay?: boolean | null },
  now: Date,
): DueBucket {
  if (task.dueAt === undefined || task.dueAt === null) {
    return "noDate";
  }
  const due = new Date(task.dueAt);
  const day = task.dueAllDay
    ? dayCode(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate())
    : dayCode(due.getFullYear(), due.getMonth(), due.getDate());
  const today = dayCode(now.getFullYear(), now.getMonth(), now.getDate());
  if (day < today) {
    return "overdue";
  }
  return day === today ? "today" : "upcoming";
}

function dayCode(year: number, month: number, date: number) {
  return year * 10_000 + (month + 1) * 100 + date;
}
