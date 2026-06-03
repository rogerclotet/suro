"use server";

import { getLocale } from "next-intl/server";
import * as v from "valibot";
import type { Project } from "@/app/_data/project";
import { getPostHogServer } from "@/lib/posthog-server";
import { revalidateLocalizedPath } from "@/lib/revalidate";
import { requireProject, requireSession } from "@/server/action-auth";
import { db } from "@/server/db";
import { events } from "@/server/db/schema";
import { translateNotificationBody } from "@/server/notification-i18n";
import { sendProjectNotification } from "@/server/push";
import { eventSchema } from "./data";

export async function createEvent(
  data: v.InferInput<typeof eventSchema>,
  project: Project,
) {
  const session = await requireSession();
  const serverProject = await requireProject(project.id);

  const parsedData = v.parse(eventSchema, data);
  if (
    parsedData.dates.from === undefined ||
    parsedData.dates.to === undefined
  ) {
    throw new Error("Missing dates");
  }

  const startAt = new Date(parsedData.dates.from);
  const endAt = new Date(parsedData.dates.to);

  if (parsedData.allDay) {
    endAt.setUTCDate(endAt.getUTCDate() + 1);
  }

  await db.insert(events).values({
    name: parsedData.name,
    description: parsedData.description,
    startAt,
    endAt,
    allDay: parsedData.allDay,
    projectId: serverProject.id,
    createdBy: session.user.id,
  });

  revalidateLocalizedPath({
    pathname: "/groups/[projectId]/calendar",
    params: { projectId: serverProject.id },
  });

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "create_event",
    properties: {
      projectId: serverProject.id,
      usersCount: serverProject.users.length,
      hours: (endAt.getTime() - startAt.getTime()) / 3600000,
      allDay: parsedData.allDay,
    },
  });

  const locale = await getLocale();

  setTimeout(() => {
    let timeRange = parsedData.dates.from?.toLocaleDateString(locale, {
      dateStyle: "short",
    });
    if (parsedData.dates.to !== parsedData.dates.from) {
      timeRange += ` - ${parsedData.dates.to?.toLocaleDateString(locale, {
        dateStyle: "short",
      })}`;
    }

    const params = { name: parsedData.name, timeRange };
    void (async () => {
      const fallbackBody = await translateNotificationBody(
        "event_created",
        params,
        null,
      );
      await sendProjectNotification({
        project: serverProject,
        body: fallbackBody,
        bodyKey: "event_created",
        bodyParams: params,
        title: serverProject.name,
        path: `/groups/${serverProject.id}/calendar`,
        type: "event_created",
        section: "calendar",
      });
    })().catch((err) => {
      console.error(
        "Failed to send push notification after creating event",
        err,
      );
    });
  }, 0);
}
