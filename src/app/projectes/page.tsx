import { checkAuth } from "@/lib/check-auth";
import { Suspense } from "react";
import CreateProjectButton from "./_components/create-project/create-project-button";
import ProjectsTable from "./_components/projects-table";

export default async function ProjectesPage() {
  await checkAuth();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Gestionar projectes</h1>
        <CreateProjectButton />
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
