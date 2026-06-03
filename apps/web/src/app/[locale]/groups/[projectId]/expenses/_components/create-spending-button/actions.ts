"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";
import { db } from "@/server/db";
import { pots, spendings } from "@/server/db/schema";
import { translateNotificationBody } from "@/server/notification-i18n";
import { getPot } from "@/server/pots";
import { getUserProject } from "@/server/projects";
import { sendProjectNotification } from "@/server/push";
import { spendingSchema } from "./data";

export async function createSpending(
  potId: string,
  data: v.InferInput<typeof spendingSchema>,
) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const pot = await getPot(potId);
  if (!pot) {
    throw new Error("Pot not found");
  }

  const project = await getUserProject(pot.projectId);
  if (!project) {
    throw new Error("Project not found");
  }
  if (!project.users.find((u) => u.user.id === session.user.id)) {
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
      projectId: pot.projectId,
      potId,
    });

    // Reopen the pot if it was settled
    if (pot.settledAt !== null) {
      await db.update(pots).set({ settledAt: null }).where(eq(pots.id, potId));
    }
  } catch (e) {
    const posthog = getPostHogServer();
    posthog.captureException(e, session.user.id, {
      action: "create_spending",
      potId,
      projectId: pot.projectId,
    });
    throw new Error("Error creating spending", { cause: e });
  }

  setTimeout(() => {
    const hasDescription = !!parsedData.description;
    const bodyKey = hasDescription
      ? "spending_created_with_description"
      : "spending_created";
    const params = hasDescription
      ? {
          description: parsedData.description as string,
          amount: parsedData.amount,
        }
      : { amount: parsedData.amount };

    void (async () => {
      const fallbackBody = await translateNotificationBody(
        bodyKey,
        params,
        null,
      );
      await sendProjectNotification({
        project,
        body: fallbackBody,
        bodyKey,
        bodyParams: params,
        title: project.name,
        path: `/groups/${pot.projectId}/expenses/${potId}`,
        type: "spending_created",
        section: "expenses",
      });
    })().catch((err) => {
      console.error(
        "Failed to send push notification after creating spending",
        err,
      );
    });
  }, 0);

  revalidatePath(`/[locale]/groups/${pot.projectId}/expenses`, "page");
  revalidatePath(`/[locale]/groups/${pot.projectId}/expenses/${potId}`, "page");

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "create_spending",
    properties: {
      projectId: pot.projectId,
      potId,
      usersCount: pot.users.length,
      amount: parsedData.amount,
      currency: "EUR",
    },
  });
}
