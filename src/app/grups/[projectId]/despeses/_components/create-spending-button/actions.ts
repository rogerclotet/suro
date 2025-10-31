"use server";

import { revalidatePath } from "next/cache";
import * as v from "valibot";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";
import { db } from "@/server/db";
import { spendings } from "@/server/db/schema";
import { getUserProject } from "@/server/projects";
import { sendProjectNotification } from "@/server/push";
import { spendingSchema } from "./data";

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
    const posthog = getPostHogServer();
    posthog.captureException(e, session.user.id, {
      action: "create_spending",
      projectId: projectId,
    });
    throw new Error("Error creating spending", { cause: e });
  }

  setTimeout(() => {
    sendProjectNotification({
      project,
      body: parsedData.description
        ? `Nova despesa: ${parsedData.description} (${parsedData.amount}€)`
        : `Nova despesa: ${parsedData.amount}€`,
      title: project.name,
      path: `/grups/${project.id}/despeses`,
    }).catch((err) => {
      console.error(
        "Failed to send push notification after creating spending",
        err,
      );
    });
  }, 0);

  revalidatePath(`/grups/${projectId}/despeses`);

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "create_spending",
    properties: {
      projectId: projectId,
      usersCount: project.users.length,
      amount: parsedData.amount,
      currency: "EUR",
    },
  });
}
