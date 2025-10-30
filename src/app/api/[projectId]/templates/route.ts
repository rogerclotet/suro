import type { NextRequest } from "next/server";
import { getTemplates } from "@/server/lists";

export const GET = async (
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await params;

  const templates = await getTemplates(projectId);
  return Response.json(templates);
};
