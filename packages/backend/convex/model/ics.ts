import type { Doc, Id } from "../_generated/dataModel";

/**
 * Minimal RFC 5545 iCalendar generator (no external lib — the `ics` npm package
 * isn't safe in the Convex isolate). Mirrors the Drizzle app's calendar.ics
 * route: one VEVENT per event, all-day vs timed handled distinctly.
 */

export type IcsAttendee = { name?: string; email: string };

export type BuildIcsArgs = {
  calendarName: string;
  events: Doc<"events">[];
  /** Maps an event id to its public web URL (the VEVENT URL property). */
  eventUrl: (eventId: Id<"events">) => string;
  /** Organizer (event creator) by event id. */
  organizerById: Map<Id<"events">, IcsAttendee>;
  /** Project members, listed as attendees on every event (PWA parity). */
  attendees: IcsAttendee[];
  /** Epoch ms used for DTSTAMP. */
  now: number;
};

const CRLF = "\r\n";

/** Escape a text value per RFC 5545 §3.3.11. */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\n|\r/g, "\\n");
}

/** Fold a content line to <=75 octets with CRLF + single-space continuation. */
function foldLine(line: string): string {
  if (line.length <= 75) {
    return line;
  }
  const parts: string[] = [];
  let rest = line;
  // First line: 75 chars. Continuations: leading space + 74 chars.
  parts.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 0) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  return parts.join(CRLF);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** UTC date-time in iCalendar basic format: YYYYMMDDTHHMMSSZ. */
function formatUtcDateTime(ms: number): string {
  const d = new Date(ms);
  return (
    `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}` +
    `T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`
  );
}

/** UTC date-only in iCalendar basic format: YYYYMMDD (for all-day VALUE=DATE). */
function formatUtcDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}`;
}

function contactLine(prop: string, contact: IcsAttendee): string {
  const cn = contact.name ? `;CN=${escapeText(contact.name)}` : "";
  return `${prop}${cn}:mailto:${contact.email}`;
}

function eventLines(event: Doc<"events">, args: BuildIcsArgs): string[] {
  const lines = ["BEGIN:VEVENT", `UID:${event._id}@suro`];
  lines.push(`DTSTAMP:${formatUtcDateTime(args.now)}`);

  if (event.allDay) {
    // Stored endAt is already last-day + 1 day === ICS's exclusive all-day end.
    lines.push(`DTSTART;VALUE=DATE:${formatUtcDate(event.startAt)}`);
    lines.push(`DTEND;VALUE=DATE:${formatUtcDate(event.endAt)}`);
  } else {
    lines.push(`DTSTART:${formatUtcDateTime(event.startAt)}`);
    lines.push(`DTEND:${formatUtcDateTime(event.endAt)}`);
  }

  lines.push(`SUMMARY:${escapeText(event.name)}`);
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  }
  lines.push(`URL:${args.eventUrl(event._id)}`);

  const organizer = args.organizerById.get(event._id);
  if (organizer) {
    lines.push(contactLine("ORGANIZER", organizer));
  }
  for (const attendee of args.attendees) {
    lines.push(contactLine("ATTENDEE", attendee));
  }

  lines.push("END:VEVENT");
  return lines;
}

export function buildIcs(args: BuildIcsArgs): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Suro//Calendar//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeText(args.calendarName)}`,
  ];
  for (const event of args.events) {
    lines.push(...eventLines(event, args));
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(foldLine).join(CRLF)}${CRLF}`;
}
