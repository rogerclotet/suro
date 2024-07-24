import { Button } from "@/components/ui/button";
import { checkAuth } from "@/lib/check-auth";
import { LayoutTemplate } from "lucide-react";
import Link from "next/link";
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
      <div className="mb-4 flex items-start justify-between gap-4">
        <h1 className="mt-1 text-xl font-semibold">Llistes</h1>

        <div className="flex flex-grow flex-col items-end justify-between gap-2 sm:flex-row sm:items-center">
          <Button variant="neutral" size="sm" asChild className="gap-2">
            <Link href={`/grups/${projectId}/llistes/plantilles`}>
              <LayoutTemplate size={18} />
              Gestionar plantilles
            </Link>
          </Button>
          <CreateListButton projectId={projectId} />
        </div>
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
