import assert from "node:assert";
import { desc, eq } from "drizzle-orm";
import { Logger } from "next-axiom";
import { auth } from "@/auth";
import { db } from "./db";
import { spendings } from "./db/schema";

const log = new Logger();

export async function getProjectSpendings(projectId: string) {
  const session = await auth();
  assert(session, "Unauthenticated user");

  try {
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
    log.error("Error getting project spendings", { error: e, projectId });
    await log.flush();
    return [];
  }
}
