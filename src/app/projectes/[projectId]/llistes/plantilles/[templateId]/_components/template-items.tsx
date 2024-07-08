"use client";

import type { Template } from "@/app/_data/list";
import { useSelectedProject } from "@/app/_state/project-state";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import React, { Fragment } from "react";
import { updateTemplateItems } from "./actions";
import NewTemplateItem from "./new-template-item";
import TemplateItem from "./template-item";

type Item = Template["items"][number];
type ItemWithIndex = Item & { index: number };

export default function TemplateItems({ template }: { template: Template }) {
  const [itemsByCategory, setItemsByCategory] =
    React.useState<ReturnType<typeof groupItemsByCategory>>();
  const [animationParent] = useAutoAnimate();
  const { project } = useSelectedProject();

  const groupItemsByCategory = React.useCallback(
    (items: Template["items"]) => {
      const categories = new Map<string, ItemWithIndex[]>();

      for (let i = 0; i < items.length; i++) {
        const item = items[i]!;
        const category =
          project?.categories.find((c) => c.id === item.category)?.name ?? "";
        if (!categories.has(category)) {
          categories.set(category, []);
        }

        categories.get(category)!.push({ ...item, index: i });
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

  function sorted(items: ItemWithIndex[]) {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }

  async function handleItemChange(
    index: number,
    newName: string,
    newCategory: string,
  ) {
    const newItems = [...template.items];
    newItems[index] = { name: newName, category: newCategory };
    await updateTemplateItems(
      template,
      newItems.map((item) => ({ name: item.name, category: item.category })),
    );
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
              <TemplateItem
                key={item.index}
                item={item}
                onChange={(name, cat) =>
                  handleItemChange(item.index, name, cat)
                }
              />
            ))}
          </Fragment>
        ))}
      </ul>
    </div>
  );
}
