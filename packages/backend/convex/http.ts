import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { verifyFileToken } from "./model/fileUrls";
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

  // Canonical origin for absolute links (calendar event URLs, etc.). Set SITE_URL
  // explicitly on the Convex deployment; this fallback is just the prod default.
  const siteUrl = process.env.SITE_URL ?? "https://suroapp.cat";
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

/**
 * Serve a stored blob under our own host so file URLs read as `<our domain>/f`
 * instead of `*.convex.cloud`. Front this route's host (`<deployment>.convex.site`)
 * with a domain you own (see deploy/traefik/familia.yml) and set FILE_URL_BASE.
 *   GET /f?id=<storageId>&token=<hmac>
 * `token` (HMAC over the id, keyed by FILE_URL_SECRET) is the only gate — the
 * route is public, so the unguessable URL is the bearer secret, exactly like the
 * calendar feed. URLs are minted by `serveFileUrl`.
 */
const serveFile = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const token = url.searchParams.get("token");
  if (!id || !token) {
    return new Response("Missing id or token", { status: 400 });
  }
  if (!(await verifyFileToken(id, token))) {
    return new Response("Forbidden", { status: 403 });
  }

  const blob = await ctx.storage.get(id as Id<"_storage">);
  if (blob === null) {
    return new Response("Not found", { status: 404 });
  }

  const headers: Record<string, string> = {
    // Immutable: a storage id always maps to the same bytes.
    "Cache-Control": "private, max-age=31536000, immutable",
  };
  if (blob.type) {
    headers["Content-Type"] = blob.type;
  }
  return new Response(blob, { status: 200, headers });
});

http.route({ path: "/f", method: "GET", handler: serveFile });

export default http;
