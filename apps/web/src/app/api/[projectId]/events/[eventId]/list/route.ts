import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getEventList } from "@/server/lists";

export const dynamic = "force-dynamic";

export const GET = async (
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string; eventId: string }> },
) => {
  const { projectId, eventId } = await params;

  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const list = await getEventList(projectId, eventId);
  if (!list) {
    return new Response("List not found", { status: 404 });
  }

  return Response.json(list);
};
