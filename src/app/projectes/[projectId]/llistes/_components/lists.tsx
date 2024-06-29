import type { List } from "@/app/_data/list";
import { getLists } from "@/server/lists";
import ListPreview from "./list-preview";

export default async function Lists({ projectId }: { projectId: string }) {
  const lists = await getLists(projectId);
  lists.sort((a, b) => todoCount(b) - todoCount(a));

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {lists.map((list) => (
        <ListPreview key={list.id} list={list} />
      ))}
    </div>
  );
}

function todoCount(list: List) {
  return list.items.filter((item) => item.completed).length;
}
