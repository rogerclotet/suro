import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CreateProject from "../_components/navigation/create-project/create-project";
import ProjectsTable from "./_components/projects-table";

export default async function ProjectesPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="mb-4 text-xl font-semibold">Gestionar projectes</h1>
        <CreateProject />
      </div>

      <ProjectsTable />
    </div>
  );
}
