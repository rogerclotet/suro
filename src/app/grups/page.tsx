import { Suspense } from "react";
import { checkAuth } from "@/lib/check-auth";
import CreateProjectButton from "./_components/create-project/create-project-button";
import ProjectsTable from "./_components/projects-table";

export default async function GrupsPage() {
  await checkAuth();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="font-semibold text-xl">Gestionar grups</h1>
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
