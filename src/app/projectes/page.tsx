import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import CreateProject from "./_components/create-project/create-project-button";
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

      <Suspense
        fallback={
          <div className="flex h-[200px] justify-center">
            <span className="loading loading-spinner" />
          </div>
        }
      >
        <ProjectsTable />
      </Suspense>
    </div>
  );
}
