"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import React, { Fragment } from "react";
import type { Template } from "@/app/_data/list";
import { useProjects } from "@/app/_state/project-state";
import { updateTemplateItems } from "./actions";
import NewTemplateItem from "./new-template-item";
import TemplateItem from "./template-item";

type Item = Template["items"][number];
type ItemWithIndex = Item & { index: number };

export default function TemplateItems({ template }: { template: Template }) {
  const [items, setItems] = React.useState<Template["items"]>(template.items);
  const [itemsByCategory, setItemsByCategory] =
    React.useState<ReturnType<typeof groupItemsByCategory>>();
  const [animationParent] = useAutoAnimate();
  const { project } = useProjects();

  const sorted = React.useCallback((items: ItemWithIndex[]) => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

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

        categories.get(category)?.push({ ...item, index: i });
      }

      const result = [];
      for (const [category, items] of categories.entries()) {
        result.push({ category, items: sorted(items) });
      }

      result.sort((a, b) => a.category.localeCompare(b.category));

      return result;
    },
    [project, sorted],
  );

  React.useEffect(() => {
    if (!project) {
      return;
    }
    setItemsByCategory(groupItemsByCategory(items));
  }, [items, groupItemsByCategory, project]);

  async function handleItemChanged(
    index: number,
    newName: string,
    newCategory: string | null,
  ) {
    const newItems = [...template.items];

    if (newName === "") {
      newItems.splice(index, 1);
    } else {
      newItems[index] = { name: newName, category: newCategory };
    }

    setItems(newItems);

    await updateTemplateItems(
      template,
      newItems.map((item) => ({ name: item.name, category: item.category })),
    );
  }

  function handleItemAdded(item: Item) {
    setItems([...items, item]);
  }

  return (
    <div className="w-full">
      <ul
        ref={animationParent}
        className="mx-auto flex max-w-lg flex-col items-stretch gap-1"
      >
        <NewTemplateItem template={template} onCreate={handleItemAdded} />

        {itemsByCategory?.map(({ category, items }) => (
          <Fragment key={category}>
            <h3 key={`title_${category}`} className="text-lg font-semibold">
              {category}
            </h3>

            {items.map((item) => (
              <TemplateItem
                key={item.index}
                template={template}
                item={item}
                onChange={(name, cat) =>
                  handleItemChanged(item.index, name, cat)
                }
              />
            ))}
          </Fragment>
        ))}
      </ul>
    </div>
  );
}
