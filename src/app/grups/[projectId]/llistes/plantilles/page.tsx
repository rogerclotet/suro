import { Suspense } from "react";
import { checkAuth } from "@/lib/check-auth";
import CreateTemplateButton from "./_components/create-template/create-template-button";
import { TemplatePreviewSkeleton } from "./_components/template-preview";
import Templates from "./_components/templates";

export default async function PlantillesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  await checkAuth();

  const { projectId } = await params;

  return (
    <div className="space-y-4">
      <CreateTemplateButton projectId={projectId} />

      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array<undefined>(3)].map((_, i) => (
              <TemplatePreviewSkeleton key={i.toString()} />
            ))}
          </div>
        }
      >
        <Templates projectId={projectId} />
      </Suspense>
    </div>
  );
}
