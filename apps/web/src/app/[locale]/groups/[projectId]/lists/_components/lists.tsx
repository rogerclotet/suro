"use client";

import { ChevronDown, InfoIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { List } from "@/app/_data/list";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { useProjectLists } from "@/lib/queries/use-project-lists";
import CreateListButton from "./create-list/create-list-button";
import ListPreview, { ListPreviewSkeleton } from "./list-preview";

// Mirrors the mobile overview's completed pagination: the section starts with
// a page of rows and grows in place behind "show more".
const COMPLETED_PAGE_SIZE = 5;

export default function Lists({ projectId }: { projectId: string }) {
  const t = useTranslations("lists");
  const lists = useProjectLists(projectId);
  const [completedLimit, setCompletedLimit] = useState(COMPLETED_PAGE_SIZE);

  if (lists === undefined) {
    return (
      <div className="mx-auto w-full max-w-lg divide-y divide-border">
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

  const hasMoreCompleted = completedLists.length > completedLimit;

  // Same sectioning as the mobile overview: favorites / lists / completed,
  // each rendered only while it has rows.
  const sections = [
    { key: "favorites", title: t("favorites"), lists: favoriteLists },
    { key: "lists", title: t("sectionLists"), lists: regularLists },
    {
      key: "completed",
      title: t("completed"),
      lists: completedLists.slice(0, completedLimit),
    },
  ].filter((section) => section.lists.length > 0);

  return (
    <>
      <div className="mx-auto w-full max-w-lg">
        {sections.map((section) => (
          <section key={section.key}>
            <h2 className="px-4 pt-4 pb-1 text-muted-foreground text-xs uppercase tracking-wider">
              {section.title}
            </h2>
            <div className="divide-y divide-border">
              {section.lists.map((list) => (
                <ListPreview key={list.id} list={list} />
              ))}
            </div>
            {section.key === "completed" && hasMoreCompleted && (
              <button
                type="button"
                onClick={() =>
                  setCompletedLimit((limit) => limit + COMPLETED_PAGE_SIZE)
                }
                className="flex w-full items-center justify-center gap-1.5 py-3 text-muted-foreground transition-opacity hover:opacity-70"
              >
                <ChevronDown size={16} />
                <span className="font-bold text-[13px]">
                  {t("showMoreCompleted")}
                </span>
              </button>
            )}
          </section>
        ))}
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
