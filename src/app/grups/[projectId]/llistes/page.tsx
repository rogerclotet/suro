import { LayoutTemplate, Tags } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { checkAuth } from "@/lib/check-auth";
import CreateListButton from "./_components/create-list/create-list-button";
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
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <h1 className="mt-1 text-xl font-semibold">Llistes</h1>

        <div className="flex grow flex-col items-end justify-between gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-row flex-wrap items-center justify-end gap-2">
            <Button variant="neutral" size="sm" asChild className="gap-2">
              <Link href={`/grups/${projectId}/llistes/plantilles`}>
                <LayoutTemplate size={18} />
                Plantilles
              </Link>
            </Button>
            <Button variant="neutral" size="sm" asChild className="gap-2">
              <Link href={`/grups/${projectId}/llistes/categories`}>
                <Tags size={18} />
                Categories
              </Link>
            </Button>
          </div>

          <CreateListButton projectId={projectId} />
        </div>
      </div>

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
