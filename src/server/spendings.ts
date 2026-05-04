"use server";

import assert from "node:assert";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";
import { isProjectMember } from "./action-auth";
import { db } from "./db";
import { spendings } from "./db/schema";

export async function getProjectSpendings(projectId: string) {
  const session = await auth();
  assert(session, "Unauthenticated user");

  try {
    if (!(await isProjectMember(projectId, session.user.id))) {
      return [];
    }

    const result = await db.query.spendings.findMany({
      where: eq(spendings.projectId, projectId),
      with: {
        from: true,
        to: true,
      },
      orderBy: [desc(spendings.createdAt)],
      limit: 50,
    });

    return result;
  } catch (e) {
    const posthog = getPostHogServer();
    posthog.captureException(e, session.user.id, {
      action: "get_project_spendings",
      projectId,
    });
    return [];
  }
}
