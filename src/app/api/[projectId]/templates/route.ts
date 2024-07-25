import { getTemplates } from "@/server/lists";
import { withAxiom, type AxiomRequest } from "next-axiom";

export const GET = withAxiom(
  async (
    request: AxiomRequest,
    { params: { projectId } }: { params: { projectId: string } },
  ) => {
    const templates = await getTemplates(projectId);
    return Response.json(templates);
  },
);