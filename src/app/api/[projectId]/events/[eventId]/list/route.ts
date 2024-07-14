import { auth } from "@/auth";
import { getEventList } from "@/server/lists";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  {
    params: { projectId, eventId },
  }: { params: { projectId: string; eventId: string } },
) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const list = await getEventList(projectId, eventId);
  if (!list) {
    return new Response("List not found", { status: 404 });
  }

  return Response.json(list);
}
