"use server";

import type { Project } from "@/app/_data/project";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { events } from "@/server/db/schema";
import * as v from "valibot";
import { eventSchema } from "./data";
import { revalidatePath } from "next/cache";
import { sendProjectNotification } from "@/server/push";

export async function createEvent(
  data: v.InferInput<typeof eventSchema>,
  project: Project,
) {
  const session = await auth();
  if (!session) {
    throw new Error("Not logged in");
  }

  if (!project.users.some((user) => user.user.id === session.user.id)) {
    throw new Error("The user is not part of the project");
  }

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
    projectId: project.id,
    createdBy: session.user.id,
  });

  revalidatePath(`/grups/${project.id}/calendari`);

  setTimeout(() => {
    let timeRange = parsedData.dates.from?.toLocaleDateString("ca-ES", {
      dateStyle: "short",
    });
    if (parsedData.dates.to !== parsedData.dates.from) {
      timeRange += ` - ${parsedData.dates.to?.toLocaleDateString("ca-ES", {
        dateStyle: "short",
      })}`;
    }

    sendProjectNotification({
      project,
      body: `Esdeveniment nou: ${parsedData.name} (${timeRange})`,
      title: project.name,
      path: `/grups/${project.id}/calendari`,
    }).catch((err) => {
      console.error(
        "Failed to send push notification after creating event",
        err,
      );
    });
  }, 0);
}
