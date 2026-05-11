import type { getEvents } from "@/server/events";

export type Event = Awaited<ReturnType<typeof getEvents>>[number];
export type CalendarEvent = Omit<Event, "project">;
