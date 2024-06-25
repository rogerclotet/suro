"use server";

import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { projectToUsers } from "./db/schema";

export async function getProjects() {
  const session = await auth();
  if (!session) {
    return [];
  }

  const results = await db.query.projectToUsers.findMany({
    with: { user: true, project: true },
    where: eq(projectToUsers.userId, session.user.id),
  });

  return results.map((result) => result.project);
}
