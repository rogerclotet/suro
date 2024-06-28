import { auth } from "@/auth";
import { getLists } from "@/server/lists";
import { getUserProject } from "@/server/projects";
import { redirect } from "next/navigation";
import CreateListButton from "./_components/create-list/create-list-button";
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

  const lists = await getLists(project.id);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="mb-4 text-xl font-semibold">Llistes</h1>
        <CreateListButton project={project} />
      </div>

      <Lists lists={lists} />
    </div>
  );
}
