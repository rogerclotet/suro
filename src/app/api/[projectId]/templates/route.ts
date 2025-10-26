import { type AxiomRequest, withAxiom } from "next-axiom";
import { getTemplates } from "@/server/lists";

export const GET = withAxiom(
  async (
    request: AxiomRequest,
    { params: { projectId } }: { params: { projectId: string } },
  ) => {
    const templates = await getTemplates(projectId);
    return Response.json(templates);
  },
);
