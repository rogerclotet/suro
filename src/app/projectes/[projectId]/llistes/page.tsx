import { auth } from "@/auth";
import { getProject } from "@/server/projects";
import { redirect } from "next/navigation";
import Lists from "./_components/lists";

export default async function ListesPage({
  params: { projectId },
}: {
  params: { projectId: string };
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const project = await getProject(projectId);
  if (!project) {
    redirect("/");
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Llistes</h1>

      <Lists project={project} />
    </div>
  );
}
