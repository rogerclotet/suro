import type { Template } from "@/app/_data/list";

export async function getTemplates(projectId: string) {
  const res = await fetch(`/api/${projectId}/templates`);

  return (await res.json()) as Template[];
}
