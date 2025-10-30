import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getLists } from "@/server/lists";

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

  const lists = await getLists(projectId);
  if (
    !lists[0]?.project.users.some((user) => user.userId === session.user.id)
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  return Response.json(lists);
};
