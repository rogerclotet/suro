import { checkAuth } from "@/lib/check-auth";
import { Suspense } from "react";
import CreateTemplateButton from "./_components/create-template/create-template-button";
import { TemplatePreviewSkeleton } from "./_components/template-preview";
import Templates from "./_components/templates";

export default async function PlantillesPage({
  params: { projectId },
}: {
  params: { projectId: string };
}) {
  await checkAuth();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Plantilles</h1>

        <CreateTemplateButton projectId={projectId} />
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array<undefined>(3)].map((_, i) => (
              <TemplatePreviewSkeleton key={i} />
            ))}
          </div>
        }
      >
        <Templates projectId={projectId} />
      </Suspense>
    </div>
  );
}
