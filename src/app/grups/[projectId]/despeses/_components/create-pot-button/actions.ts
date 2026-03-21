"use server";

import { revalidatePath } from "next/cache";
import * as v from "valibot";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";
import { db } from "@/server/db";
import { pots, potToUsers } from "@/server/db/schema";
import { getUserProject } from "@/server/projects";
import { sendProjectNotification } from "@/server/push";
import { potSchema } from "./data";

export async function createPot(
  projectId: string,
  data: v.InferInput<typeof potSchema>,
) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const project = await getUserProject(projectId);
  if (project?.users.find((u) => u.user.id === session.user.id) === undefined) {
    throw new Error("The user is not part of the project");
  }

  const parsedData = v.parse(potSchema, data);

  // Validate that all member IDs are actual project members
  const projectUserIds = new Set(project.users.map((u) => u.user.id));
  for (const memberId of parsedData.memberIds) {
    if (!projectUserIds.has(memberId)) {
      throw new Error("One or more members are not part of the project");
    }
  }

  try {
    const [pot] = await db
      .insert(pots)
      .values({
        name: parsedData.name,
        projectId,
        createdBy: session.user.id,
      })
      .returning({ id: pots.id });

    if (!pot) {
      throw new Error("Failed to create pot");
    }

    await db.insert(potToUsers).values(
      parsedData.memberIds.map((userId) => ({
        potId: pot.id,
        userId,
      })),
    );

    revalidatePath(`/grups/${projectId}/despeses`);

    getPostHogServer().capture({
      distinctId: session.user.id,
      event: "create_pot",
      properties: {
        projectId,
        potId: pot.id,
        membersCount: parsedData.memberIds.length,
      },
    });

    setTimeout(() => {
      sendProjectNotification({
        project,
        body: `Nou pot creat: ${parsedData.name}`,
        title: project.name,
        path: `/grups/${project.id}/despeses/${pot.id}`,
        type: "pot_created",
        section: "despeses",
      }).catch((err) => {
        console.error(
          "Failed to send push notification after creating pot",
          err,
        );
      });
    }, 0);

    return pot.id;
  } catch (e) {
    const posthog = getPostHogServer();
    posthog.captureException(e, session.user.id, {
      action: "create_pot",
      projectId,
    });
    throw new Error("Error creating pot", { cause: e });
  }
}
