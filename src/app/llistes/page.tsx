import { auth } from "@/auth";
import { getProjects } from "@/server/projects";
import { redirect } from "next/navigation";
import Lists from "./_components/lists";

export default async function ListesPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const projects = await getProjects();

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Llistes</h1>

      <Lists projects={projects} />
    </div>
  );
}
