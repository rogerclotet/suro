import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { checkAuth } from "@/lib/check-auth";
import Link from "next/link";
import { Suspense } from "react";
import { setTimeout } from "timers/promises";
import CreateTemplateButton from "./_components/create-template/create-template-button";
import { TemplatePreviewSkeleton } from "./_components/template-preview";
import Templates from "./_components/templates";

export default async function PlantillesPage({
  params: { projectId },
}: {
  params: { projectId: string };
}) {
  await checkAuth();

  await setTimeout(3000);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild className="text-xl font-semibold">
                <Link href={`/projectes/${projectId}/llistes`}>Llistes</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="scale-150" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-xl font-semibold">
                Plantilles
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

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
