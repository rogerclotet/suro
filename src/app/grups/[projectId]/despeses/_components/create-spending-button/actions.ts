"use server";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { spendings } from "@/server/db/schema";
import { Logger } from "next-axiom";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import { spendingSchema } from "./data";
import { sendProjectNotification } from "@/server/push";
import { getUserProject } from "@/server/projects";

export async function createSpending(
  projectId: string,
  data: v.InferInput<typeof spendingSchema>,
) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const project = await getUserProject(projectId);
  if (project?.users.find((u) => u.user.id === session.user.id) === undefined) {
    throw new Error("The user is not part of the project");
  }

  const parsedData = v.parse(spendingSchema, data);

  const description =
    parsedData.description === "" ? null : (parsedData.description ?? null);

  try {
    await db.insert(spendings).values({
      amount: Math.round(parsedData.amount * 100),
      currency: "EUR",
      description,
      from: parsedData.from,
      to: parsedData.to,
      createdBy: session.user.id,
      projectId: projectId,
    });
  } catch (e) {
    const log = new Logger();
    log.error("Error creating spending", {
      error: e,
      projectId: projectId,
    });
    throw new Error("Error creating spending", { cause: e });
  }

  setTimeout(() => {
    sendProjectNotification(
      project,
      parsedData.description
        ? `Nova despesa: ${parsedData.description} (${parsedData.amount}€)`
        : `Nova despesa: ${parsedData.amount}€`,
      project.name,
      `/grups/${project.id}/despeses`,
    ).catch((err) => {
      console.error(
        "Failed to send push notification after creating spending",
        err,
      );
    });
  }, 0);

  revalidatePath(`/grups/${projectId}/despeses`);
}
