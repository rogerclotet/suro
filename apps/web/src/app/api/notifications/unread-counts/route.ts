import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  getTotalUnreadCount,
  getUnreadCountsForUser,
} from "@/server/notifications";

export const dynamic = "force-dynamic";

export const GET = async (request: NextRequest) => {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get("projectId");

  const [counts, total] = await Promise.all([
    projectId
      ? getUnreadCountsForUser(session.user.id, projectId)
      : Promise.resolve({}),
    getTotalUnreadCount(session.user.id),
  ]);

  return Response.json({ counts, total });
};
