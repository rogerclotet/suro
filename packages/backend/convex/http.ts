import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { buildIcs, type IcsAttendee } from "./model/ics";

const http = httpRouter();

// Registers the Convex Auth HTTP routes (OAuth callbacks, magic-link verify).
auth.addHttpRoutes(http);

/**
 * Public, token-gated iCalendar feed for a project:
 *   GET /calendar.ics?projectId=<id>&token=<calendarToken>
 * The token (projects.calendarToken) is the only gate — calendar apps can't
 * carry a session, so this is a secret-URL subscription, the standard model.
 */
const calendarIcs = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  const token = url.searchParams.get("token");
  if (!projectId || !token) {
    return new Response("Missing projectId or token", { status: 400 });
  }

  const data = await ctx.runQuery(internal.events.exportData, {
    projectId: projectId as Id<"projects">,
    token,
  });
  if (data === null) {
    return new Response("Not found", { status: 404 });
  }

  const siteUrl = process.env.SITE_URL ?? "https://suro.clotet.dev";
  const organizerById = new Map<Id<"events">, IcsAttendee>(
    data.organizers.map((o) => [o.eventId, { name: o.name, email: o.email }]),
  );

  const ics = buildIcs({
    calendarName: data.calendarName,
    events: data.events,
    eventUrl: (eventId) => `${siteUrl}/groups/${projectId}/calendar/${eventId}`,
    organizerById,
    attendees: data.attendees,
    now: Date.now(),
  });

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="calendar.ics"',
    },
  });
});

http.route({ path: "/calendar.ics", method: "GET", handler: calendarIcs });

export default http;
