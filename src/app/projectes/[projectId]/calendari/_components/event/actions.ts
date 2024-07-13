"use server";

import type { Project } from "@/app/_data/project";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { events } from "@/server/db/schema";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import { eventSchema } from "./data";

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
  if (parsedData.dates.from === undefined) {
    throw new Error("Missing start date");
  }

  const startAt = new Date(parsedData.dates.from);
  if (parsedData.allDay) {
    startAt.setHours(0, 0, 0, 0);
  }

  const endAt = new Date(parsedData.dates.to ?? parsedData.dates.from);
  if (parsedData.allDay) {
    endAt.setHours(23, 59, 59, 999);
  } else if (parsedData.dates.to === undefined) {
    endAt.setHours(endAt.getHours() + 1, 0, 0, 0);
  }

  await db.insert(events).values({
    name: parsedData.name,
    description: parsedData.description,
    startAt,
    endAt,
    projectId: project.id,
    createdBy: session.user.id,
  });

  revalidatePath(`/projectes/${project.id}/calendari`);
}
