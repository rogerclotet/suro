"use server";

import assert from "node:assert";
import { and, desc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import * as v from "valibot";
import type { Project } from "@/app/_data/project";
import type {
  ExclusionData,
  GiftIdeaData,
  SecretSanta,
  SecretSantaData,
} from "@/app/_data/secret-santa";
import {
  exclusionSchema,
  giftIdeasSchema,
  secretSantaSchema,
} from "@/app/_data/secret-santa";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";
import { db } from "../db";
import {
  secretSantaParticipants,
  secretSantas,
} from "../db/schema/secret-santa";
import { getUserProject } from "../projects";
import { sendNotificationsToUsers } from "../push";
import { generateAssignments } from "./assignments";
import type { Assignment } from "./types";

const MAX_ASSIGNMENTS_RETRIES = 10;

export async function getCurrentSecretSanta(projectId: string) {
  const session = await auth();
  assert(session, "Unauthenticated user");

  const secretSanta = await db.query.secretSantas.findFirst({
    with: {
      participants: {
        with: {
          user: true,
        },
      },
    },
    where: and(
      eq(secretSantas.projectId, projectId),
      isNull(secretSantas.archivedAt),
    ),
    orderBy: [desc(secretSantas.datetime)],
  });

  return secretSanta;
}

export async function createSecretSanta(
  project: Project,
  data: SecretSantaData,
) {
  const session = await auth();
  assert(session, "Unauthenticated user");

  if (project.createdBy !== session.user.id) {
    throw new Error(
      "Only the creator of the project can create a secret santa",
    );
  }

  const validatedData = v.safeParse(secretSantaSchema, data);
  if (!validatedData.success) {
    throw new Error(
      `Invalid data: ${validatedData.issues.map((issue) => issue.message).join(", ")}`,
    );
  }

  const memberIds = new Set(project.users.map((u) => u.user.id));
  if (validatedData.output.participants.some((id) => !memberIds.has(id))) {
    throw new Error("All participants must be members of the project");
  }

  const id = await db.transaction(async (trx) => {
    try {
      const result = await trx
        .insert(secretSantas)
        .values({
          name: validatedData.output.name,
          description: validatedData.output.description,
          priceRange: validatedData.output.priceRange,
          datetime: validatedData.output.datetime,
          projectId: project.id,
          createdBy: session.user.id,
        })
        .returning({ id: secretSantas.id });

      const id = result[0]?.id;
      if (!id) {
        throw new Error("Failed to create secret santa");
      }

      for (const participant of validatedData.output.participants) {
        await trx.insert(secretSantaParticipants).values({
          secretSantaId: id,
          userId: participant,
        });
      }

      return id;
    } catch (error) {
      trx.rollback();
      throw error;
    }
  });

  revalidatePath(`/[locale]/groups/${project.id}/secret-santa`, "page");

  getPostHogServer().capture({
    distinctId: session?.user.id,
    event: "create_secret_santa",
    properties: {
      projectId: project.id,
      secretSantaId: id,
      usersCount: validatedData.output.participants.length,
    },
  });
}

export async function updateSecretSanta(
  secretSanta: SecretSanta,
  data: SecretSantaData,
) {
  const session = await auth();
  assert(session, "Unauthenticated user");

  const project = await getUserProject(secretSanta.projectId);
  if (project?.createdBy !== session.user.id) {
    throw new Error(
      "Only the creator of the project can update a secret santa",
    );
  }

  const validatedData = v.safeParse(secretSantaSchema, data);
  if (!validatedData.success) {
    throw new Error(
      `Invalid data: ${validatedData.issues.map((issue) => issue.message).join(", ")}`,
    );
  }

  const memberIds = new Set(project.users.map((u) => u.user.id));
  if (validatedData.output.participants.some((id) => !memberIds.has(id))) {
    throw new Error("All participants must be members of the project");
  }

  await db.transaction(async (trx) => {
    try {
      await trx
        .update(secretSantas)
        .set(validatedData.output)
        .where(eq(secretSantas.id, secretSanta.id));

      if (secretSanta.assignmentsDone) {
        // Don't update participants if it has already been started
        return;
      }

      for (const participant of validatedData.output.participants) {
        if (secretSanta.participants.some((p) => p.userId === participant)) {
          continue;
        }

        await trx
          .insert(secretSantaParticipants)
          .values({
            secretSantaId: secretSanta.id,
            userId: participant,
          })
          .onConflictDoNothing({
            target: [
              secretSantaParticipants.userId,
              secretSantaParticipants.secretSantaId,
            ],
          });
      }

      for (const participant of secretSanta.participants) {
        if (!validatedData.output.participants.includes(participant.userId)) {
          await trx
            .delete(secretSantaParticipants)
            .where(eq(secretSantaParticipants.userId, participant.userId));
        }
      }
    } catch (error) {
      console.error(error);
      getPostHogServer().captureException(error, session?.user.id, {
        action: "update_secret_santa",
        projectId: secretSanta.projectId,
        secretSantaId: secretSanta.id,
        usersCount: secretSanta.participants.length,
      });
      trx.rollback();
      throw error;
    }
  });

  revalidatePath(
    `/[locale]/groups/${secretSanta.projectId}/secret-santa`,
    "page",
  );

  getPostHogServer().capture({
    distinctId: session?.user.id,
    event: "update_secret_santa",
    properties: {
      projectId: secretSanta.projectId,
      secretSantaId: secretSanta.id,
      usersCount: secretSanta.participants.length,
    },
  });
}

export async function archiveSecretSanta(secretSanta: SecretSanta) {
  const session = await auth();
  assert(session, "Unauthenticated user");

  const project = await getUserProject(secretSanta.projectId);
  if (project?.createdBy !== session.user.id) {
    throw new Error(
      "Only the creator of the project can archive a secret santa",
    );
  }

  await db
    .update(secretSantas)
    .set({
      archivedAt: new Date(),
    })
    .where(eq(secretSantas.id, secretSanta.id));

  revalidatePath(
    `/[locale]/groups/${secretSanta.projectId}/secret-santa`,
    "page",
  );

  getPostHogServer().capture({
    distinctId: session?.user.id,
    event: "archive_secret_santa",
    properties: {
      projectId: secretSanta.projectId,
      secretSantaId: secretSanta.id,
      usersCount: secretSanta.participants.length,
    },
  });
}

export async function createExclusion(
  secretSanta: SecretSanta,
  exclusions: v.InferInput<typeof exclusionSchema>,
) {
  const session = await auth();
  assert(session, "Unauthenticated user");

  const project = await getUserProject(secretSanta.projectId);
  if (project?.createdBy !== session.user.id) {
    throw new Error("Only the creator of the project can create an exclusion");
  }

  const validatedData = v.safeParse(exclusionSchema, exclusions);
  if (!validatedData.success) {
    throw new Error(
      `Invalid data: ${validatedData.issues.map((issue) => issue.message).join(", ")}`,
    );
  }

  const participantIds = new Set(secretSanta.participants.map((p) => p.userId));
  if (validatedData.output.exclusions.some((id) => !participantIds.has(id))) {
    throw new Error("Exclusions must reference current participants");
  }

  if (
    secretSanta.exclusions.some((exclusion) =>
      areEqualExclusions(exclusion, validatedData.output.exclusions),
    )
  ) {
    const t = await getTranslations("secretSanta");
    return { error: t("exclusionAlreadyExists") };
  }

  await db
    .update(secretSantas)
    .set({
      exclusions: [...secretSanta.exclusions, validatedData.output.exclusions],
    })
    .where(eq(secretSantas.id, secretSanta.id));

  revalidatePath(
    `/[locale]/groups/${secretSanta.projectId}/secret-santa`,
    "page",
  );

  getPostHogServer().capture({
    distinctId: session?.user.id,
    event: "create_exclusion",
    properties: {
      projectId: secretSanta.projectId,
      secretSantaId: secretSanta.id,
      usersCount: secretSanta.participants.length,
      exclusionsCount: secretSanta.exclusions.length + 1,
    },
  });
}

function areEqualExclusions(exclusions1: string[], exclusions2: string[]) {
  return (
    exclusions1.length === exclusions2.length &&
    exclusions1.every((e) => exclusions2.includes(e))
  );
}

export async function deleteExclusion(
  secretSanta: SecretSanta,
  exclusion: ExclusionData,
) {
  const session = await auth();
  assert(session, "Unauthenticated user");

  const project = await getUserProject(secretSanta.projectId);
  if (project?.createdBy !== session.user.id) {
    throw new Error("Only the creator of the project can delete an exclusion");
  }

  await db
    .update(secretSantas)
    .set({
      exclusions: secretSanta.exclusions.filter(
        (e) => !areEqualExclusions(e, exclusion),
      ),
    })
    .where(eq(secretSantas.id, secretSanta.id));

  revalidatePath(
    `/[locale]/groups/${secretSanta.projectId}/secret-santa`,
    "page",
  );

  getPostHogServer().capture({
    distinctId: session?.user.id,
    event: "delete_exclusion",
    properties: {
      projectId: secretSanta.projectId,
      secretSantaId: secretSanta.id,
      usersCount: secretSanta.participants.length,
      exclusionsCount: secretSanta.exclusions.length - 1,
    },
  });
}

export async function startSecretSanta(secretSanta: SecretSanta) {
  const session = await auth();
  assert(session, "Unauthenticated user");

  const project = await getUserProject(secretSanta.projectId);
  if (project?.createdBy !== session.user.id) {
    throw new Error("Only the creator of the project can start a secret santa");
  }

  if (secretSanta.assignmentsDone) {
    throw new Error("The secret santa has already been started");
  }

  let assignments: Assignment[] | null = null;
  for (let i = 0; i < MAX_ASSIGNMENTS_RETRIES; i++) {
    try {
      assignments = generateAssignments(secretSanta);
      break;
    } catch (_error) {
      getPostHogServer().capture({
        distinctId: session?.user.id,
        event: "secret_santa_assignments_retry",
        properties: {
          projectId: secretSanta.projectId,
          secretSantaId: secretSanta.id,
          usersCount: secretSanta.participants.length,
          exclusionsCount: secretSanta.exclusions.length,
          totalExclusions: secretSanta.exclusions.flat().length,
          retry: i,
        },
      });
    }
  }

  if (!assignments) {
    getPostHogServer().capture({
      distinctId: session?.user.id,
      event: "secret_santa_assignments_failed",
      properties: {
        projectId: secretSanta.projectId,
        secretSantaId: secretSanta.id,
        usersCount: secretSanta.participants.length,
        exclusionsCount: secretSanta.exclusions.length,
        totalExclusions: secretSanta.exclusions.flat().length,
        retries: MAX_ASSIGNMENTS_RETRIES,
      },
    });

    const t = await getTranslations("secretSanta");
    return {
      error: t("noValidAssignments"),
    };
  }

  await db.transaction(async (trx) => {
    try {
      for (const assignment of assignments) {
        await trx
          .update(secretSantaParticipants)
          .set({
            assignedTo: assignment.assignedTo,
          })
          .where(eq(secretSantaParticipants.id, assignment.participant));
      }

      await trx
        .update(secretSantas)
        .set({
          assignmentsDone: true,
        })
        .where(eq(secretSantas.id, secretSanta.id));

      return true;
    } catch (error) {
      trx.rollback();
      throw error;
    }
  });

  revalidatePath(
    `/[locale]/groups/${secretSanta.projectId}/secret-santa`,
    "page",
  );

  const tNotifications = await getTranslations("secretSanta");
  sendNotificationsToUsers({
    users: secretSanta.participants
      .map((p) => p.userId)
      .filter((u) => u !== session?.user.id),
    title: secretSanta.name,
    body: tNotifications("drawAnnouncement"),
    path: `/groups/${secretSanta.projectId}/secret-santa`,
  });

  getPostHogServer().capture({
    distinctId: session?.user.id,
    event: "start_secret_santa",
    properties: {
      projectId: secretSanta.projectId,
      secretSantaId: secretSanta.id,
      usersCount: secretSanta.participants.length,
      exclusionsCount: secretSanta.exclusions.length,
      totalExclusions: secretSanta.exclusions.flat().length,
    },
  });
}

export async function getAssignment(secretSantaId: string) {
  const session = await auth();
  assert(session, "Unauthenticated user");

  const assignments = await db.query.secretSantaParticipants.findFirst({
    where: and(
      eq(secretSantaParticipants.secretSantaId, secretSantaId),
      eq(secretSantaParticipants.userId, session.user.id),
    ),
    with: {
      assignedTo: {
        with: {
          user: true,
        },
      },
    },
  });

  return assignments?.assignedTo;
}

export async function updateGiftIdeas(
  projectId: string,
  secretSantaId: string,
  giftIdeas: GiftIdeaData[],
) {
  const session = await auth();
  assert(session, "Unauthenticated user");

  const participant = await db.query.secretSantaParticipants.findFirst({
    where: and(
      eq(secretSantaParticipants.secretSantaId, secretSantaId),
      eq(secretSantaParticipants.userId, session.user.id),
    ),
  });

  if (!participant) {
    throw new Error("Secret Santa participant not found");
  }

  const validatedData = v.safeParse(giftIdeasSchema, giftIdeas);
  if (!validatedData.success) {
    throw new Error(
      `Invalid data: ${validatedData.issues.map((issue) => issue.message).join(", ")}`,
    );
  }

  await db
    .update(secretSantaParticipants)
    .set({
      giftIdeas: validatedData.output,
    })
    .where(eq(secretSantaParticipants.id, participant.id));

  revalidatePath(`/[locale]/groups/${projectId}/secret-santa/ideas`, "page");
}
