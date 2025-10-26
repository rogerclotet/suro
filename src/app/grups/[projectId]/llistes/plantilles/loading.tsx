"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import LoadingPage from "@/components/ui/loading-page";

export default function Loading() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <LoadingPage>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild className="text-xl font-semibold">
              <Link href={`/grups/${projectId}/llistes`}>Llistes</Link>
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
    </LoadingPage>
  );
}
