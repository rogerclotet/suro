"use server";

import assert from "node:assert";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";
import { isProjectMember } from "./action-auth";
import { db } from "./db";
import { pots, spendings } from "./db/schema";

export async function getProjectPots(projectId: string) {
  const session = await auth();
  assert(session, "Unauthenticated user");

  try {
    if (!(await isProjectMember(projectId, session.user.id))) {
      return [];
    }

    const result = await db.query.pots.findMany({
      where: eq(pots.projectId, projectId),
      with: {
        users: { columns: {}, with: { user: true } },
      },
      orderBy: [desc(pots.createdAt)],
    });

    // Sort: active pots first (settledAt is null), then archived by settledAt desc
    return result.sort((a, b) => {
      if (a.settledAt === null && b.settledAt !== null) return -1;
      if (a.settledAt !== null && b.settledAt === null) return 1;
      return 0;
    });
  } catch (e) {
    const posthog = getPostHogServer();
    posthog.captureException(e, session.user.id, {
      action: "get_project_pots",
      projectId,
    });
    return [];
  }
}

export async function getPot(potId: string) {
  const session = await auth();
  assert(session, "Unauthenticated user");

  try {
    const result = await db.query.pots.findFirst({
      where: eq(pots.id, potId),
      with: {
        users: { columns: {}, with: { user: true } },
      },
    });

    if (!result) {
      return null;
    }

    if (!(await isProjectMember(result.projectId, session.user.id))) {
      return null;
    }

    return result;
  } catch (e) {
    const posthog = getPostHogServer();
    posthog.captureException(e, session.user.id, {
      action: "get_pot",
      potId,
    });
    return null;
  }
}

export async function getPotSpendings(potId: string) {
  const session = await auth();
  assert(session, "Unauthenticated user");

  try {
    const pot = await db.query.pots.findFirst({
      columns: { projectId: true },
      where: eq(pots.id, potId),
    });

    if (!pot || !(await isProjectMember(pot.projectId, session.user.id))) {
      return [];
    }

    const result = await db.query.spendings.findMany({
      where: eq(spendings.potId, potId),
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
      action: "get_pot_spendings",
      potId,
    });
    return [];
  }
}
