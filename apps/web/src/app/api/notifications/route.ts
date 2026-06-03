import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getNotificationsForUser } from "@/server/notifications";

export const dynamic = "force-dynamic";

export const GET = async (request: NextRequest) => {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = Number(searchParams.get("limit") ?? "100");
  const offset = Number(searchParams.get("offset") ?? "0");

  const notifications = await getNotificationsForUser(session.user.id, {
    limit,
    offset,
  });

  return Response.json(notifications);
};
