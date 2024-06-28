import { getLists } from "@/server/lists";
import { setTimeout } from "timers/promises";
import ListPreview from "./list-preview";

export default async function Lists({ projectId }: { projectId: string }) {
  const lists = await getLists(projectId);

  await setTimeout(3000);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {lists.map((list) => (
        <ListPreview key={list.id} list={list} />
      ))}
    </div>
  );
}
