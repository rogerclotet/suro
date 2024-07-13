import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { events } from "./db/schema";

export async function getEvents(projectId: string) {
  const session = await auth();
  if (!session) {
    return [];
  }

  try {
    const results = await db.query.events.findMany({
      where: eq(events.projectId, projectId),
    });

    return results;
  } catch (e) {
    console.error(e);
    return [];
  }
}
