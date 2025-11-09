"use server";

import assert from "node:assert";
import { desc, eq } from "drizzle-orm";
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
