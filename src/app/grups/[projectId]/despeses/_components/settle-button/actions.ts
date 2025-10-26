"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { spendings } from "@/server/db/schema";
import { getUserProject } from "@/server/projects";
import type { SettlingPayment } from "./data";

export async function settlePayments(
  projectId: string,
  payments: SettlingPayment[],
) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const project = await getUserProject(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  if (!project.users.some((u) => u.user.id === session.user.id)) {
    throw new Error("Unauthorized");
  }

  await db.insert(spendings).values(
    payments.map((p) => ({
      amount: p.amount,
      currency: p.currency,
      description: "Liquidació de pagaments",
      from: p.from,
      to: p.to,
      createdBy: session.user.id,
      projectId,
    })),
  );

  revalidatePath(`/grups/${projectId}/despeses`);
}
