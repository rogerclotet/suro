"use server";

import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";
import { revalidateLocalizedPath } from "@/lib/revalidate";
import { db } from "@/server/db";
import { pots, spendings } from "@/server/db/schema";
import { getPot } from "@/server/pots";
import type { SettlingPayment } from "./data";

export async function settlePayments(
  potId: string,
  payments: SettlingPayment[],
) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const pot = await getPot(potId);
  if (!pot) {
    throw new Error("Pot not found");
  }

  const potUserIds = new Set(pot.users.map((u) => u.user.id));
  if (!potUserIds.has(session.user.id)) {
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
      projectId: pot.projectId,
      potId,
    })),
  );

  // Mark pot as settled
  await db
    .update(pots)
    .set({ settledAt: new Date() })
    .where(eq(pots.id, potId));

  revalidateLocalizedPath({
    pathname: "/groups/[projectId]/expenses",
    params: { projectId: pot.projectId },
  });
  revalidateLocalizedPath({
    pathname: "/groups/[projectId]/expenses/[potId]",
    params: { projectId: pot.projectId, potId },
  });

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "settle_spendings",
    properties: {
      projectId: pot.projectId,
      potId,
      usersCount: pot.users.length,
      amount: payments.reduce((acc, p) => acc + p.amount, 0),
      currency: "EUR",
    },
  });
}
