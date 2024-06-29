import type { List } from "@/app/_data/list";
import Link from "next/link";

export default function ListPreview({ list }: { list: List }) {
  const todoCount = list.items.filter((item) => item.completed).length;

  return (
    <Link href={`/projectes/${list.projectId}/llistes/${list.id}`}>
      <div className="card bg-base-300 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between gap-2">
            <h2 className="card-title">{list.name}</h2>
            {todoCount > 0 && (
              <span className="badge badge-lg">{todoCount}</span>
            )}
          </div>
          <p className="line-clamp-2">{list.description}</p>
        </div>
      </div>
    </Link>
  );
}

export function ListPreviewSkeleton() {
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
