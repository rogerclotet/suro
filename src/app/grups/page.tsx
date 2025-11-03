import { Suspense } from "react";
import { checkAuth } from "@/lib/check-auth";
import CreateProjectButton from "./_components/create-project/create-project-button";
import ProjectsTable from "./_components/projects-table";

export default async function GrupsPage() {
  await checkAuth();

  return (
    <>
      <div className="space-y-4">
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

      <CreateProjectButton />
    </>
  );
}
