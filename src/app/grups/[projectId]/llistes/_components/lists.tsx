import { CornerRightUp } from "lucide-react";
import { redirect } from "next/navigation";
import type { List } from "@/app/_data/list";
import { auth } from "@/auth";
import { getLists } from "@/server/lists";
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

  const incompleteLists = lists.filter(
    (list) =>
      list.items.length === 0 || list.items.some((item) => !item.completed),
  );
  const completedLists = lists.filter(
    (list) =>
      list.items.length > 0 && list.items.every((item) => item.completed),
  );

  incompleteLists.sort(compareLists);
  completedLists.sort(compareLists);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {incompleteLists.map((list) => (
          <ListPreview key={list.id} list={list} />
        ))}
      </div>

      {completedLists.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-md font-semibold text-muted-foreground">
            Completades:
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedLists.map((list) => (
              <ListPreview key={list.id} list={list} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function compareLists(a: List, b: List) {
  const updatedAtA = a.updatedAt?.getTime() ?? a.createdAt?.getTime() ?? 0;
  const itemsUpdatedAtA = a.items.reduce(
    (acc, item) => Math.max(acc, item.updatedAt?.getTime() ?? 0),
    0,
  );

  const updatedAtB = b.updatedAt?.getTime() ?? b.createdAt?.getTime() ?? 0;
  const itemsUpdatedAtB = b.items.reduce(
    (acc, item) => Math.max(acc, item.updatedAt?.getTime() ?? 0),
    0,
  );

  return (
    Math.max(updatedAtB, itemsUpdatedAtB) -
    Math.max(updatedAtA, itemsUpdatedAtA)
  );
}
