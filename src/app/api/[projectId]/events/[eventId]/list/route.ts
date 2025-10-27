import { type AxiomRequest, withAxiom } from "next-axiom";
import { auth } from "@/auth";
import { getEventList } from "@/server/lists";

export const dynamic = "force-dynamic";

export const GET = withAxiom(
  async (
    _request: AxiomRequest,
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
  },
);
