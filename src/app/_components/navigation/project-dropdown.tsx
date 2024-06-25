import { auth } from "@/auth";
import { db } from "@/server/db";
import { projectToUsers } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export default async function ProjectSelector() {
  const session = await auth();

  if (!session) {
    return null;
  }

  const results = await db.query.projectToUsers.findMany({
    with: { user: true, project: true },
    where: eq(projectToUsers.userId, session.user.id),
  });

  return (
    <select className="select select-bordered w-full max-w-xs">
      {results.map((result) => (
        <option key={result.project.id} value={result.project.id}>
          {result.project.name}
        </option>
      ))}
      <option value="new">+ Nou projecte</option>
    </select>
  );
}
