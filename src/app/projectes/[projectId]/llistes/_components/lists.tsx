import type { List } from "@/app/_data/list";
import { auth } from "@/auth";
import { getLists } from "@/server/lists";
import { CornerRightUp } from "lucide-react";
import { redirect } from "next/navigation";
import ListPreview from "./list-preview";

export default async function Lists({ projectId }: { projectId: string }) {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  const lists = await getLists(projectId);

  if (lists.length === 0) {
    return (
      <div className="flex flex-row items-center justify-end gap-4 pr-8 text-right md:pr-14">
        Encara no hi ha llistes, pots crear-ne una aquí{" "}
        <CornerRightUp className="mb-4 flex-shrink-0" />
      </div>
    );
  }

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
