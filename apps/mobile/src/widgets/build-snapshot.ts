import type { Doc } from "backend/convex/_generated/dataModel";
import { type Locale, normalizeLocale } from "@/i18n/config";
import {
  type EventTimes,
  endOfDay,
  formatTimeOfDay,
  formatTimeRange,
  isEventOnDay,
  startOfDay,
} from "@/lib/event-dates";
import { PREVIEW_LIMIT, UPCOMING_WINDOW_MS } from "./constants";
import { widgetLabels } from "./labels";
import type { WidgetSnapshot, WidgetTaskRow } from "./types";

type CalEvent = EventTimes & { _id: string; name: string };
type Task = Doc<"listItems"> & { listName: string };

function dueDayCode(task: Task): number {
  const d = new Date(task.dueAt ?? 0);
  if (task.dueAllDay) {
    return (
      d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate()
    );
  }
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function todayCode(now: Date): number {
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

function formatDue(
  item: { dueAt: number; dueAllDay?: boolean },
  locale: Locale,
): string {
  const date = new Date(item.dueAt);
  const dateLabel = date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year:
      date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
  if (item.dueAllDay) {
    return dateLabel;
  }
  const timeLabel = date.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${dateLabel} ${timeLabel}`;
}

function formatEventWhen(event: CalEvent, today: Date, locale: Locale): string {
  if (isEventOnDay(event, today)) {
    return formatTimeOfDay(event, locale) || widgetLabels(locale).allDay;
  }
  return formatTimeRange(event, locale);
}

/** Pick the next events for the widget: today's first, then upcoming days. */
export function pickWidgetEvents(
  events: CalEvent[],
  now = new Date(),
): CalEvent[] {
  const endOfToday = endOfDay(now).getTime();
  const today = events
    .filter((event) => isEventOnDay(event, now))
    .slice(0, PREVIEW_LIMIT);
  if (today.length >= PREVIEW_LIMIT) {
    return today;
  }
  const upcoming = events
    .filter((event) => event.startAt > endOfToday)
    .slice(0, PREVIEW_LIMIT - today.length);
  return [...today, ...upcoming];
}

/** Top incomplete assigned tasks, preserving the server sort order. */
export function pickWidgetTasks(tasks: Task[]): Task[] {
  return tasks.slice(0, PREVIEW_LIMIT);
}

export function buildWidgetSnapshot(input: {
  locale: string | undefined;
  signedIn: boolean;
  projectId?: string;
  projectName?: string;
  events?: CalEvent[];
  tasks?: Task[];
  now?: Date;
}): WidgetSnapshot {
  const locale = normalizeLocale(input.locale);
  const labels = widgetLabels(locale);
  const now = input.now ?? new Date();

  if (!input.signedIn) {
    return {
      updatedAt: now.getTime(),
      locale,
      signedIn: false,
      labels,
      events: [],
      tasks: [],
    };
  }

  if (!input.projectId) {
    return {
      updatedAt: now.getTime(),
      locale,
      signedIn: true,
      labels,
      events: [],
      tasks: [],
    };
  }

  const projectId = input.projectId;
  const events = input.events ?? [];
  const tasks = input.tasks ?? [];
  const todayIndex = todayCode(now);

  return {
    updatedAt: now.getTime(),
    locale,
    signedIn: true,
    projectId,
    projectName: input.projectName,
    homePath: `/${projectId}/home`,
    labels,
    events: pickWidgetEvents(events, now).map((event) => ({
      id: event._id,
      name: event.name,
      when: formatEventWhen(event, now, locale),
      path: `/${projectId}/calendar/${event._id}`,
    })),
    tasks: pickWidgetTasks(tasks).map((task) => {
      const overdue = task.dueAt !== undefined && dueDayCode(task) < todayIndex;
      const row: WidgetTaskRow = {
        id: task._id,
        name: task.name,
        listName: task.listName,
        overdue,
        path: `/${projectId}/lists/${task.listId}`,
      };
      if (task.dueAt !== undefined) {
        row.dueLabel = formatDue(
          { dueAt: task.dueAt, dueAllDay: task.dueAllDay },
          locale,
        );
      }
      return row;
    }),
  };
}

/** Bounds for `api.events.listByRange`, anchored at the start of today. */
export function widgetEventBounds(now = new Date()): {
  from: number;
  to: number;
} {
  const from = startOfDay(now).getTime();
  return { from, to: from + UPCOMING_WINDOW_MS };
}
