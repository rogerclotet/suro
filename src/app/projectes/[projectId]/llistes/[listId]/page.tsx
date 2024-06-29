import { getList } from "@/server/lists";

export default async function ListPage({
  params: { listId },
}: {
  params: { listId: string };
}) {
  const list = await getList(listId);
  if (!list) {
    return <div>Llista no trobada</div>;
  }

  return <div>Llista {list.name}</div>;
}
