import { getTemplates } from "@/server/lists";

export async function GET(
  request: Request,
  { params: { projectId } }: { params: { projectId: string } },
) {
  const templates = await getTemplates(projectId);
  return Response.json(templates);
}
