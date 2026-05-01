import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getList } from "@/server/lists";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ listId: string }> },
) {
  const session = await auth();
  if (!session) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { listId } = await params;
  const list = await getList(listId);

  if (!list) {
    return Response.json({ message: "List not found" }, { status: 404 });
  }

  return Response.json(list);
}
