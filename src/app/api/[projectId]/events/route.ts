import { type AxiomRequest, withAxiom } from "next-axiom";
import { auth } from "@/auth";
import { getEvents } from "@/server/events";

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

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return new Response("Missing date range", { status: 400 });
    }

    const fromDate = new Date(parseInt(from));
    const toDate = new Date(parseInt(to));

    if (fromDate > toDate) {
      return new Response("Invalid date range", { status: 400 });
    }

    const events = await getEvents(projectId, fromDate, toDate);

    return Response.json(events);
  },
);
