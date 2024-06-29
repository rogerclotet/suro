import { getList } from "@/server/lists";
import Link from "next/link";

export default async function ListPage({
  params: { listId },
}: {
  params: { listId: string };
}) {
  const list = await getList(listId);

  if (!list) {
    return (
      <div className="space-y-4">
        <div className="alert alert-error">{"No s'ha trobat la llista"}</div>
        <Link href="/" className="btn btn-neutral">
          Tornar a la pàgina principal
        </Link>
      </div>
    );
  }

  return <div>Llista {list.name}</div>;
}
