import { auth } from "@/auth";
import { and, eq, gte, lte, or } from "drizzle-orm";
import { db } from "./db";
import { events } from "./db/schema";

export async function getEvents(projectId: string, from: Date, to: Date) {
  const session = await auth();
  if (!session) {
    return [];
  }

  try {
    const results = await db.query.events.findMany({
      where: and(
        eq(events.projectId, projectId),
        or(gte(events.startAt, from), lte(events.endAt, to)),
      ),
    });

    return results;
  } catch (e) {
    console.error(e);
    return [];
  }
}
