import assert from "node:assert";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { cache } from "react";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";
import { db } from "./db";
import { events, projectToUsers } from "./db/schema";

export const getEvent = cache(async (projectId: string, eventId: string) => {
  const session = await auth();
  assert(session, "Unauthenticated user");

  try {
    const result = await db.query.events.findFirst({
      where: and(eq(events.id, eventId), eq(events.projectId, projectId)),
      with: {
        project: {
          with: {
            users: true,
          },
        },
        files: {
          with: {
            uploadedBy: true,
          },
        },
      },
    });

    if (
      result?.project.users.find((u) => u.userId === session.user.id) ===
      undefined
    ) {
      throw new Error("Event not found");
    }

    return {
      ...result,
      files: result.files.map((file) => ({
        ...file,
        project: result.project,
        event: result,
      })),
    };
  } catch (e) {
    const posthog = getPostHogServer();
    posthog.captureException(e, session.user.id, {
      action: "get_event",
      projectId,
      eventId,
    });
    return undefined;
  }
});

export const getEvents = cache(
  async (projectId: string, from: Date, to: Date) => {
    const session = await auth();
    assert(session, "Unauthenticated user");

    try {
      const membership = await db.query.projectToUsers.findFirst({
        columns: { projectId: true },
        where: and(
          eq(projectToUsers.projectId, projectId),
          eq(projectToUsers.userId, session.user.id),
        ),
      });

      if (!membership) {
        throw new Error("Project not found");
      }

      const results = await db.query.events.findMany({
        where: and(
          eq(events.projectId, projectId),
          lte(events.startAt, to),
          gte(events.endAt, from),
        ),
        with: {
          project: {
            with: {
              users: true,
            },
          },
          files: {
            with: {
              uploadedBy: true,
            },
          },
        },
        orderBy: asc(events.startAt),
      });

      return results.map((result) => ({
        ...result,
        files: result.files.map((file) => ({
          ...file,
          project: result.project,
        })),
      }));
    } catch (e) {
      const posthog = getPostHogServer();
      posthog.captureException(e, session.user.id, {
        action: "get_events",
        projectId,
      });
      return [];
    }
  },
);

export const getEventsToExport = cache(async (projectId: string) => {
  const session = await auth();
  assert(session, "Unauthenticated user");

  const membership = await db.query.projectToUsers.findFirst({
    columns: { projectId: true },
    where: and(
      eq(projectToUsers.projectId, projectId),
      eq(projectToUsers.userId, session.user.id),
    ),
  });

  if (!membership) {
    throw new Error("Project not found");
  }

  const results = await db.query.events.findMany({
    where: eq(events.projectId, projectId),
    with: {
      createdBy: true,
    },
  });

  return results;
});
