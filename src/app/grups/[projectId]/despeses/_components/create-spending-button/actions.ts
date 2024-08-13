"use server";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { spendings } from "@/server/db/schema";
import { Logger } from "next-axiom";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import { spendingSchema } from "./data";

export async function createSpending(
  projectId: string,
  data: v.InferInput<typeof spendingSchema>,
) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const parsedData = v.parse(spendingSchema, data);

  const description =
    parsedData.description === "" ? null : (parsedData.description ?? null);

  try {
    await db.insert(spendings).values({
      amount: Math.round(parsedData.amount * 100),
      currency: "EUR",
      description,
      from: parsedData.from,
      to: parsedData.to,
      createdBy: session.user.id,
      projectId: projectId,
    });
  } catch (e) {
    const log = new Logger();
    log.error("Error creating spending", {
      error: e,
      projectId: projectId,
    });
    throw new Error("Error creating spending", { cause: e });
  }

  revalidatePath(`/grups/${projectId}/despeses`);
}
