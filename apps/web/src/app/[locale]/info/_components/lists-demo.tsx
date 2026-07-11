"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { InfoKey } from "@/i18n/message-keys";
import { cn } from "@/lib/utils";
import type { DemoListCategory, DemoListItem } from "../_data/mock";

function buildItems(t: (key: InfoKey) => string): DemoListItem[] {
  return [
    {
      id: "i-1",
      name: t("demoListsItemSwimsuit"),
      completed: true,
      categoryId: "c-clothes",
    },
    {
      id: "i-2",
      name: t("demoListsItemJacket"),
      completed: false,
      categoryId: "c-clothes",
    },
    {
      id: "i-3",
      name: t("demoListsItemSunscreen"),
      completed: true,
      categoryId: "c-toiletries",
    },
    {
      id: "i-4",
      name: t("demoListsItemToothbrush"),
      completed: false,
      categoryId: "c-toiletries",
    },
    {
      id: "i-5",
      name: t("demoListsItemShampoo"),
      completed: false,
      categoryId: "c-toiletries",
    },
    {
      id: "i-6",
      name: t("demoListsItemId"),
      completed: true,
      categoryId: "c-docs",
    },
    {
      id: "i-7",
      name: t("demoListsItemTrain"),
      completed: false,
      categoryId: "c-docs",
    },
  ];
}

export default function ListsDemo() {
  const t = useTranslations("info");

  const categories: DemoListCategory[] = useMemo(
    () => [
      { id: "c-clothes", name: t("demoListsCategoryClothes") },
      { id: "c-toiletries", name: t("demoListsCategoryToiletries") },
      { id: "c-docs", name: t("demoListsCategoryDocuments") },
    ],
    [t],
  );

  const [items, setItems] = useState<DemoListItem[]>(() => buildItems(t));

  const toggle = (id: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, completed: !it.completed } : it,
      ),
    );
  };

  const doneCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;

  return (
    <Card className="px-4 py-5">
      <div className="mx-auto w-full max-w-lg">
        <h3 className="px-2 font-semibold text-base text-foreground">
          {t("demoListsName")}
        </h3>
        <div className="mt-3 mb-4 flex items-center gap-2.5 px-2">
          <div className="h-1 flex-1 overflow-hidden rounded-sm bg-muted">
            <div
              className="h-full rounded-sm bg-primary transition-[width] duration-300 ease-in-out"
              style={{ width: `${(doneCount / totalCount) * 100}%` }}
            />
          </div>
          <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
            {doneCount}/{totalCount}
          </span>
        </div>
        <div className="flex flex-col gap-4">
          {categories.map((category) => {
            const categoryItems = items.filter(
              (it) => it.categoryId === category.id,
            );
            return (
              <div key={category.id}>
                <h4 className="px-2 font-semibold text-lg">{category.name}</h4>
                <ul>
                  {categoryItems.map((it) => (
                    <li
                      key={it.id}
                      className="flex flex-row items-start gap-5 rounded-lg p-2 hover:bg-muted"
                    >
                      <div className="flex flex-row items-center">
                        <Checkbox
                          id={`demo-list-${it.id}`}
                          checked={it.completed}
                          onCheckedChange={() => toggle(it.id)}
                          className="h-6 w-6 transition-all"
                        />
                      </div>
                      <label
                        htmlFor={`demo-list-${it.id}`}
                        className={cn(
                          "wrap-break-word grow cursor-pointer overflow-hidden text-left",
                          it.completed && "text-muted-foreground line-through",
                        )}
                      >
                        {it.name}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
