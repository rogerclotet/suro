import { type AxiomRequest, withAxiom } from "next-axiom";
import { getTemplates } from "@/server/lists";

export const GET = withAxiom(
  async (
    _request: AxiomRequest,
    { params }: { params: Promise<{ projectId: string }> },
  ) => {
    const { projectId } = await params;

    const templates = await getTemplates(projectId);
    return Response.json(templates);
  },
);
