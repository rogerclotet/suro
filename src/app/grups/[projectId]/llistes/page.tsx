import { Suspense } from "react";
import { checkAuth } from "@/lib/check-auth";
import { ListPreviewSkeleton } from "./_components/list-preview";
import Lists from "./_components/lists";

export default async function ListesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  await checkAuth();

  const { projectId } = await params;

  return (
    <div className="space-y-4">
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array<undefined>(3)].map((_, i) => (
              <ListPreviewSkeleton key={i.toString()} />
            ))}
          </div>
        }
      >
        <Lists projectId={projectId} />
      </Suspense>
    </div>
  );
}
