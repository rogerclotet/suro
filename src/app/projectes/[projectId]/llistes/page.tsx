import { auth } from "@/auth";
import { getUserProject } from "@/server/projects";
import { redirect } from "next/navigation";
import Lists from "./_components/lists";

export default async function ListesPage({
  params: { projectId },
}: {
  params: { projectId: string };
}) {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  const project = await getUserProject(projectId);
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
