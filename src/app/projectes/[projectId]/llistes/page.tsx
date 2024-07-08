import { checkAuth } from "@/lib/check-auth";
import { getTemplates } from "@/server/lists";
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

  const templates = await getTemplates(projectId);

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-xl font-semibold">Llistes</h1>
          <Link
            href={`/projectes/${projectId}/llistes/plantilles`}
            className="btn btn-neutral btn-sm"
          >
            <LayoutTemplate size={18} />
            Gestionar plantilles
          </Link>
        </div>

        <CreateListButton projectId={projectId} templates={templates} />
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
