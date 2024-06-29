import type { List } from "@/app/_data/list";
import Link from "next/link";

export default function ListPreview({ list }: { list: List }) {
  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">
          <Link href={`/projectes/${list.projectId}/llistes/${list.id}`}>
            {list.name}
          </Link>
        </h2>
        <p className="line-clamp-2">{list.description}</p>
        <p>{list.items.length} elements</p>
      </div>
    </div>
  );
}

export function ListPreviewSkeleton() {
  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <div className="skeleton h-8 w-52" />
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-6 w-32" />
      </div>
    </div>
  );
}
