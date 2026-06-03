"use client";

import { useEffect, useState } from "react";
import type { CalendarEvent } from "@/app/_data/event";
import LoadingPage from "@/components/ui/loading-page";
import { loadMonthEventsFromIDB } from "@/lib/offline/calendar-cache";
import { getMonthEnd } from "./_components/event/month-range";

function getContextFromPath(): { projectId?: string; monthStart: Date } {
  const segments = window.location.pathname.split("/").filter(Boolean);
  const i = segments.indexOf("groups");
  const projectId = i !== -1 ? segments[i + 1] : undefined;

  const searchParams = new URLSearchParams(window.location.search);
  const dayParam = searchParams.get("d");
  const monthStart = dayParam ? new Date(dayParam) : new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  return { projectId, monthStart };
}

export default function Loading() {
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);

  useEffect(() => {
    const { projectId, monthStart } = getContextFromPath();
    if (!projectId) return;

    const monthEnd = getMonthEnd(monthStart);
    loadMonthEventsFromIDB(monthStart, monthEnd, projectId)
      .then((items) => {
        if (items.length > 0) setEvents(items);
      })
      .catch(() => {});
  }, []);

  if (!events) return <LoadingPage />;

  return <CalendarLoadingPreview events={events} />;
}

function CalendarLoadingPreview({ events }: { events: CalendarEvent[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sorted = [...events].sort(
    (a, b) => a.startAt.getTime() - b.startAt.getTime(),
  );

  // Split into upcoming (from today) and past
  const upcoming = sorted.filter((e) => e.endAt >= today);
  const past = sorted.filter((e) => e.endAt < today);
  const display = upcoming.length > 0 ? upcoming : past;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        {display.map((event) => {
          const start = event.startAt;
          const dateLabel = start.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });
          return (
            <div
              key={event.id}
              className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3"
            >
              <div className="shrink-0 text-center text-muted-foreground text-xs tabular-nums">
                {dateLabel}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-sm">{event.name}</p>
                {event.description && (
                  <p className="truncate text-muted-foreground text-xs">
                    {event.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
