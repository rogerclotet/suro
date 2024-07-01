import { checkAuth } from "@/lib/check-auth";
import { Suspense } from "react";
import CreateListButton from "./_components/create-list/create-list-button";
import { ListPreviewSkeleton } from "./_components/list-preview";
import Lists from "./_components/lists";

export default async function ListesPage({
  params: { projectId },
}: {
  params: { projectId: string };
}) {
  await checkAuth();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Llistes</h1>
        <CreateListButton projectId={projectId} />
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array<undefined>(3)].map((_, i) => (
              <ListPreviewSkeleton key={i} />
            ))}
          </div>
        }
      >
        <Lists projectId={projectId} />
      </Suspense>
    </div>
  );
}
