"use client";

import type { Template } from "@/app/_data/list";
import { useSelectedProject } from "@/app/_state/project-state";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import React, { Fragment } from "react";
import NewTemplateItem from "./new-template-item";

export default function TemplateItems({ template }: { template: Template }) {
  const [itemsByCategory, setItemsByCategory] =
    React.useState<ReturnType<typeof groupItemsByCategory>>();
  const [animationParent] = useAutoAnimate();
  const { project } = useSelectedProject();

  const groupItemsByCategory = React.useCallback(
    (items: Template["items"]) => {
      const categories = new Map<string, Template["items"]>();

      for (const item of items) {
        const category =
          project?.categories.find((c) => c.id === item.category)?.name ?? "";
        if (!categories.has(category)) {
          categories.set(category, []);
        }

        categories.get(category)!.push(item);
      }

      const result = [];
      for (const [category, items] of categories.entries()) {
        result.push({ category, items: sorted(items) });
      }

      result.sort((a, b) => a.category.localeCompare(b.category));

      return result;
    },
    [project],
  );

  React.useEffect(() => {
    if (!project) {
      return;
    }
    setItemsByCategory(groupItemsByCategory(template.items));
  }, [template.items, groupItemsByCategory, project]);

  function sorted(items: Template["items"]) {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }

  return (
    <div className="w-full">
      <ul
        ref={animationParent}
        className="mx-auto flex flex-col items-stretch gap-1 lg:max-w-lg"
      >
        <NewTemplateItem template={template} />

        {itemsByCategory?.map(({ category, items }) => (
          <Fragment key={category}>
            <h3 key={`title_${category}`} className="text-lg font-semibold">
              {category}
            </h3>
            {items.map((item) => (
              <div key={item.name}>{item.name}</div>
            ))}
          </Fragment>
        ))}
      </ul>
    </div>
  );
}
