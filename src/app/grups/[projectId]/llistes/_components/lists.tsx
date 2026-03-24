import { InfoIcon, StarIcon } from "lucide-react";
import { redirect } from "next/navigation";
import type { List } from "@/app/_data/list";
import { auth } from "@/auth";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { getLists } from "@/server/lists";
import CreateListButton from "./create-list/create-list-button";
import ListPreview from "./list-preview";

export default async function Lists({ projectId }: { projectId: string }) {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  const lists = await getLists(projectId);

  if (lists.length === 0) {
    return (
      <>
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Encara no hi ha llistes</AlertTitle>
        </Alert>

        <CreateListButton projectId={projectId} />
      </>
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

  const favoriteLists = incompleteLists.filter((list) => list.favorite);
  const regularLists = incompleteLists.filter((list) => !list.favorite);

  favoriteLists.sort(compareLists);
  regularLists.sort(compareLists);
  completedLists.sort(compareLists);

  return (
    <>
      <div className="space-y-6">
        {favoriteLists.length > 0 && (
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 font-semibold text-md text-muted-foreground">
              <StarIcon size={15} className="fill-yellow-400 text-yellow-400" />
              Preferits
            </h2>
            <div className="columns-1 gap-2 space-y-2 sm:columns-2 xl:columns-3">
              {favoriteLists.map((list) => (
                <ListPreview key={list.id} list={list} />
              ))}
            </div>
          </div>
        )}

        {regularLists.length > 0 && (
          <div className="columns-1 gap-2 space-y-2 sm:columns-2 xl:columns-3">
            {regularLists.map((list) => (
              <ListPreview key={list.id} list={list} />
            ))}
          </div>
        )}

        {completedLists.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-md text-muted-foreground">
              Completades:
            </h2>
            <div className="columns-1 gap-2 space-y-2 sm:columns-2 xl:columns-3">
              {completedLists.map((list) => (
                <ListPreview key={list.id} list={list} />
              ))}
            </div>
          </div>
        )}
      </div>

      <CreateListButton projectId={projectId} />
    </>
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
