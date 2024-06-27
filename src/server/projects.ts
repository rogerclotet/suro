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
    columns: {},
    with: {
      project: {
        columns: { id: true, name: true, inviteToken: true },
        with: { users: { columns: {}, with: { user: true } } },
      },
    },
    where: eq(projectToUsers.userId, session.user.id),
  });

  return results.map((result) => result.project);
}
