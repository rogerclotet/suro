"use server";

import assert from "node:assert";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import type { Project } from "@/app/_data/project";
import type {
  ExclusionData,
  SecretSanta,
  SecretSantaData,
} from "@/app/_data/secret-santa";
import { exclusionSchema, secretSantaSchema } from "@/app/_data/secret-santa";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";
import { db } from "./db";
import {
  secretSantaParticipants,
  secretSantas,
} from "./db/schema/secret-santa";
import { getUserProject } from "./projects";

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
    where: eq(secretSantas.projectId, projectId),
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

  revalidatePath(`/grups/${project.id}/amic-invisible`);

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

  if (
    secretSanta.exclusions.some((exclusion) =>
      areEqualExclusions(exclusion, validatedData.output.exclusions),
    )
  ) {
    return { error: "L'exclusió ja existeix" };
  }

  await db
    .update(secretSantas)
    .set({
      exclusions: [...secretSanta.exclusions, validatedData.output.exclusions],
    })
    .where(eq(secretSantas.id, secretSanta.id));

  revalidatePath(`/grups/${secretSanta.projectId}/amic-invisible`);

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

  revalidatePath(`/grups/${secretSanta.projectId}/amic-invisible`);

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

  let assignments: { participant: string; assignedTo: string }[] | null = null;
  for (let i = 0; i < MAX_ASSIGNMENTS_RETRIES; i++) {
    try {
      assignments = assignSecretSanta(secretSanta);
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

    return {
      error:
        "No s'han pogut trobar assignacions vàlides, prova de canviar les exclusions i torna-ho a provar",
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
          .where(eq(secretSantaParticipants.userId, assignment.participant));
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

  revalidatePath(`/grups/${secretSanta.projectId}/amic-invisible`);

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

function assignSecretSanta(secretSanta: SecretSanta) {
  const participants = secretSanta.participants.map((p) => p.userId);
  const assignments: { participant: string; assignedTo: string }[] = [];

  for (const participant of participants) {
    const affectedExclusions = secretSanta.exclusions.filter((e) =>
      e.includes(participant),
    );

    const eligibleParticipants = participants.filter(
      (p) =>
        p !== participant &&
        assignments.every((a) => a.assignedTo !== p) &&
        affectedExclusions.every((e) => !e.includes(p)),
    );

    const assignedTo =
      eligibleParticipants[
        Math.floor(Math.random() * eligibleParticipants.length)
      ];
    if (!assignedTo) {
      throw new Error("No eligible participants found");
    }

    assignments.push({ participant, assignedTo });
  }

  return assignments;
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
      assignedTo: true,
    },
  });

  return assignments?.assignedTo;
}
