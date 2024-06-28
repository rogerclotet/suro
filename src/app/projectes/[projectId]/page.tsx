import { redirect } from "next/navigation";

export default function ProjectPage({
  params: { projectId },
}: {
  params: { projectId: string };
}) {
  redirect(`/projectes/${projectId}/llistes`);
}
