"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import { db } from "@/server/db";
import {
  DEFAULT_PROJECT_FEATURES,
  type ProjectFeatures,
  projects,
} from "@/server/db/schema/projects";
import { requireProject, requireSession } from "../action-auth";

const projectFeaturesUpdateSchema = v.partial(
  v.object({
    secretSanta: v.boolean(),
  }),
);

export type ProjectFeaturesUpdate = v.InferOutput<
  typeof projectFeaturesUpdateSchema
>;

export async function updateProjectFeatures(
  projectId: string,
  features: ProjectFeaturesUpdate,
) {
  const session = await requireSession();
  const project = await requireProject(projectId);

  if (project.createdBy !== session.user.id) {
    throw new Error("Only the creator of the project can update features");
  }

  const validated = v.safeParse(projectFeaturesUpdateSchema, features);
  if (!validated.success) {
    throw new Error(
      `Invalid features: ${validated.issues.map((i) => i.message).join(", ")}`,
    );
  }

  const next: ProjectFeatures = {
    ...DEFAULT_PROJECT_FEATURES,
    ...project.features,
    ...validated.output,
  };

  await db
    .update(projects)
    .set({ features: next })
    .where(eq(projects.id, projectId));

  revalidatePath(`/[locale]/groups/${projectId}`, "layout");
}
