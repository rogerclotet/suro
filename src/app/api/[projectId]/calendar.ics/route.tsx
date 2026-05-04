export const dynamic = "force-dynamic";

import { and, eq } from "drizzle-orm";
import { createEvents, type EventAttributes } from "ics";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";
import { isProjectMember } from "@/server/action-auth";
import { db } from "@/server/db";
import { projects } from "@/server/db/schema";
import { getEventsToExport } from "@/server/events";

export const GET = async (
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await params;
  const posthog = getPostHogServer();

  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!(await isProjectMember(projectId, session.user.id))) {
    return new Response("Project not found", { status: 404 });
  }

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
    events.map((e) => {
      const common: Partial<EventAttributes> = {
        title: e.name,
        description: e.description ?? undefined,
        startInputType: "utc",
        url: `https://suro.clotet.dev/grups/${projectId}/calendari/${e.id}`,
        organizer: {
          name: e.createdBy.name ?? undefined,
          email: e.createdBy.email,
        },
        attendees: attendees,
        created: e.createdAt ? e.createdAt.getTime() : undefined,
        lastModified: e.updatedAt ? e.updatedAt.getTime() : undefined,
        calName: project.name,
      };

      if (e.allDay) {
        return {
          ...common,
          start: [
            e.startAt.getUTCFullYear(),
            e.startAt.getUTCMonth() + 1,
            e.startAt.getUTCDate(),
          ],
          duration: {
            days: Math.round(
              (e.endAt.getTime() - e.startAt.getTime()) / 86400000,
            ),
          },
        };
      }

      return {
        ...common,
        start: e.startAt.getTime(),
        end: e.endAt.getTime(),
      };
    }),
  );

  if (error) {
    const session = await auth();
    posthog.captureException(error, session?.user.id, {
      action: "generate_calendar_ics",
      projectId: projectId,
    });

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
};
