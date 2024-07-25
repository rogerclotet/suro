import { auth } from "@/auth";
import { getLists } from "@/server/lists";
import { type AxiomRequest, withAxiom } from "next-axiom";

export const dynamic = "force-dynamic";

export const GET = withAxiom(
  async (
    request: AxiomRequest,
    { params: { projectId } }: { params: { projectId: string } },
  ) => {
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
  },
);
