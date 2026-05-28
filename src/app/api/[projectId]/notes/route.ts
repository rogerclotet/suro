import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getNotes } from "@/server/notes";
import { getUserProject } from "@/server/projects";

export const dynamic = "force-dynamic";

export const GET = async (
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await params;

  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const project = await getUserProject(projectId);
  if (!project) {
    return new Response("Unauthorized", { status: 401 });
  }

  const notes = await getNotes(projectId);
  return Response.json(notes);
};
