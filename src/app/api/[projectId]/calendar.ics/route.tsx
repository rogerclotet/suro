export const dynamic = "force-dynamic";

import { db } from "@/server/db";
import { projects } from "@/server/db/schema";
import { getEventsToExport } from "@/server/events";
import { and, eq } from "drizzle-orm";
import { createEvents } from "ics";

export async function GET(
  request: Request,
  { params: { projectId } }: { params: { projectId: string } },
) {
  const project = await db.query.projects.findFirst({
    columns: { name: true },
    with: {
      users: {
        columns: {},
        with: { user: { columns: { name: true, email: true } } },
      },
    },
    where: and(eq(projects.id, projectId)),
  });
  if (!project) {
    return new Response("Project not found", { status: 404 });
  }

  const attendees = project.users.map((u) => ({
    name: u.user.name ?? undefined,
    email: u.user.email,
  }));

  const events = await getEventsToExport(projectId);

  const { error, value } = createEvents(
    events.map((e) => ({
      title: e.name,
      description: e.description ?? undefined,
      start: e.startAt.getTime(),
      end: e.endAt.getTime(),
      url: `https://familia.clotet.dev/grups/${projectId}/calendari/${e.id}`,
      organizer: {
        name: e.createdBy.name ?? undefined,
        email: e.createdBy.email,
      },
      attendees: attendees,
      created: e.createdAt ? e.createdAt.getTime() : undefined,
      lastModified: e.updatedAt ? e.updatedAt.getTime() : undefined,
      calName: project.name,
    })),
  );

  if (error) {
    console.log("Error generating calendar", error);
    return new Response("Error generating calendar", {
      status: 500,
    });
  }

  return new Response(value, {
    headers: {
      "Content-Type": "text/calendar",
      "Content-Disposition": `attachment; filename="calendari.ics"`,
    },
  });
}
