import type { getEvents } from "@/server/events";

export type Event = Awaited<ReturnType<typeof getEvents>>[number];
