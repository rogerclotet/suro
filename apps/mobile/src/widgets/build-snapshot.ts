import type { api } from "backend/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { type Locale, normalizeLocale } from "@/i18n/config";
import {
  type EventTimes,
  eventWindowBounds,
  formatTimeOfDay,
  formatTimeRange,
  isEventOnDay,
  pickUpcomingEvents,
} from "@/lib/event-dates";
import { PREVIEW_LIMIT, UPCOMING_WINDOW_MS } from "./constants";
import { widgetLabels } from "./labels";
import type { WidgetSnapshot } from "./types";

type CalEvent = EventTimes & { _id: string; name: string };
type ListPreviews = FunctionReturnType<typeof api.lists.homePreviews>;

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
  return pickUpcomingEvents(events, now, PREVIEW_LIMIT);
}

export function buildWidgetSnapshot(input: {
  locale: string | undefined;
  signedIn: boolean;
  projectId?: string;
  projectName?: string;
  events?: CalEvent[];
  lists?: ListPreviews;
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
      lists: [],
    };
  }

  if (!input.projectId) {
    return {
      updatedAt: now.getTime(),
      locale,
      signedIn: true,
      labels,
      events: [],
      lists: [],
    };
  }

  const projectId = input.projectId;
  const events = input.events ?? [];
  const lists = input.lists;

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
    lists: (lists?.favoriteIds ?? []).slice(0, PREVIEW_LIMIT).flatMap((id) => {
      const list = lists?.previews.find((preview) => preview._id === id);
      return list
        ? [
            {
              id: list._id,
              name: list.name,
              done: list.done,
              total: list.total,
              path: `/${projectId}/lists/${list._id}`,
            },
          ]
        : [];
    }),
  };
}

/** Bounds for `api.events.listByRange`, anchored at the start of today. */
export function widgetEventBounds(now = new Date()): {
  from: number;
  to: number;
} {
  const { from, to } = eventWindowBounds(now, UPCOMING_WINDOW_MS);
  return { from, to };
}
