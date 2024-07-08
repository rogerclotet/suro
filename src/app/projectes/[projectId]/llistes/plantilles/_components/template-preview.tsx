import type { Template } from "@/app/_data/list";
import Link from "next/link";

export default function TemplatePreview({ template }: { template: Template }) {
  return (
    <Link
      href={`/projectes/${template.projectId}/llistes/plantilles/${template.id}`}
    >
      <div className="card bg-base-300 shadow-xl">
        <div className="card-body">
          <div className="flex items-start justify-between gap-2">
            <h2 className="card-title">{template.name}</h2>
          </div>
          <p className="line-clamp-2">{template.description}</p>
        </div>
      </div>
    </Link>
  );
}

export function TemplatePreviewSkeleton() {
  return (
    <div className="card bg-base-300 shadow-xl">
      <div className="card-body">
        <div className="skeleton h-8 w-52" />
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-6 w-32" />
      </div>
    </div>
  );
}
