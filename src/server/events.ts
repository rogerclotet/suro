"use server";

import assert from "node:assert";
import { and, asc, eq, gte, lte, or } from "drizzle-orm";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";
import { db } from "./db";
import { events } from "./db/schema";

export async function getEvent(projectId: string, eventId: string) {
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
}

export async function getEvents(projectId: string, from: Date, to: Date) {
  const session = await auth();
  assert(session, "Unauthenticated user");

  try {
    const results = await db.query.events.findMany({
      where: and(
        eq(events.projectId, projectId),
        or(gte(events.startAt, from), lte(events.endAt, to)),
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

    if (
      results?.[0]?.project.users.find((u) => u.userId === session.user.id) ===
      undefined
    ) {
      throw new Error("Project not found");
    }

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
}

export async function getEventsToExport(projectId: string) {
  const results = await db.query.events.findMany({
    where: eq(events.projectId, projectId),
    with: {
      createdBy: true,
    },
  });

  return results;
}
