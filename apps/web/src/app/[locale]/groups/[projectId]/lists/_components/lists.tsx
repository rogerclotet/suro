"use client";

import { InfoIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { List } from "@/app/_data/list";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { useProjectLists } from "@/lib/queries/use-project-lists";
import CollapsibleCompletedSection from "./collapsible-completed-section";
import CreateListButton from "./create-list/create-list-button";
import ListPreview, { ListPreviewSkeleton } from "./list-preview";

export default function Lists({ projectId }: { projectId: string }) {
  const t = useTranslations("lists");
  const lists = useProjectLists(projectId);

  if (lists === undefined) {
    return (
      <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 4 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
          <ListPreviewSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (lists.length === 0) {
    return (
      <>
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>{t("empty")}</AlertTitle>
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
          <div className="space-y-2">
            <h2 className="px-1 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
              {t("favorites")}
            </h2>
            <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 xl:grid-cols-3">
              {favoriteLists.map((list) => (
                <ListPreview key={list.id} list={list} />
              ))}
            </div>
          </div>
        )}

        {regularLists.length > 0 && (
          <div className="space-y-2">
            {favoriteLists.length > 0 && (
              <h2 className="px-1 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                {t("others")}
              </h2>
            )}
            <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 xl:grid-cols-3">
              {regularLists.map((list) => (
                <ListPreview key={list.id} list={list} />
              ))}
            </div>
          </div>
        )}

        <CollapsibleCompletedSection lists={completedLists} />
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

  const diff =
    Math.max(updatedAtB, itemsUpdatedAtB) -
    Math.max(updatedAtA, itemsUpdatedAtA);

  return diff !== 0 ? diff : a.name.localeCompare(b.name);
}
