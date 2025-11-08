"use server";

import assert from "node:assert";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import type { Project } from "@/app/_data/project";
import type { SecretSanta } from "@/app/_data/secret-santa";
import { secretSantaSchema } from "@/app/_data/secret-santa";
import { auth } from "@/auth";
import { db } from "./db";
import {
  secretSantaParticipants,
  secretSantas,
} from "./db/schema/secret-santa";

export async function getCurrentSecretSanta(projectId: string) {
  const session = await auth();
  assert(session, "Unauthenticated user");

  const secretSanta = await db.query.secretSantas.findFirst({
    where: eq(secretSantas.projectId, projectId),
    orderBy: [desc(secretSantas.datetime)],
  });

  return secretSanta;
}

export async function createSecretSanta(project: Project, data: SecretSanta) {
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

  await db.transaction(async (trx) => {
    try {
      const result = await trx
        .insert(secretSantas)
        .values({
          name: validatedData.output.name,
          description: validatedData.output.description,
          priceRange: validatedData.output.priceRange,
          datetime: validatedData.output.datetime,
          exclusions: validatedData.output.exclusions,
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
    } catch (error) {
      trx.rollback();
      throw error;
    }
  });

  revalidatePath(`/grups/${project.id}/amic-invisible`);
}
