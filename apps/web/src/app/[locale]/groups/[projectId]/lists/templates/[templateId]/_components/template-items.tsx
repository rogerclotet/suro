"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Fragment, useCallback, useMemo, useState } from "react";
import type { Template } from "@/app/_data/list";
import { useStableAutoAnimate } from "@/lib/use-stable-auto-animate";
import NewTemplateItem from "./new-template-item";
import TemplateItem from "./template-item";

type Item = Template["items"][number];
type ItemWithIndex = Item & { index: number };

export default function TemplateItems({ template }: { template: Template }) {
  const [items, setItems] = useState<Template["items"]>(template.items);
  // Strict-mode-safe variant: useAutoAnimate double-initializes in dev and
  // the duplicate observers cancel each other's animations.
  const animationParent = useStableAutoAnimate<HTMLUListElement>();
  const updateTemplate = useMutation(api.templates.update);

  // Persist the full items array (Convex stores template items inline).
  const persist = useCallback(
    async (newItems: Template["items"]) => {
      await updateTemplate({
        templateId: template.id as Id<"listTemplates">,
        name: template.name,
        description: template.description ?? undefined,
        items: newItems,
      });
    },
    [updateTemplate, template.id, template.name, template.description],
  );

  const sorted = useCallback((items: ItemWithIndex[]) => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const groupItemsByCategory = useCallback(
    (items: Template["items"]) => {
      const categories = new Map<string, ItemWithIndex[]>();

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item) continue;

        const category = item.category ?? "";
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
    [sorted],
  );

  const itemsByCategory = useMemo(
    () => groupItemsByCategory(items),
    [items, groupItemsByCategory],
  );

  async function handleItemChanged(
    index: number,
    newName: string,
    newCategory: string | null,
  ) {
    const newItems = [...items];

    if (newName === "") {
      newItems.splice(index, 1);
    } else {
      newItems[index] = { name: newName, category: newCategory };
    }

    setItems(newItems);
    await persist(newItems);
  }

  async function handleItemAdded(item: Item) {
    const newItems = [...items, item];
    setItems(newItems);
    await persist(newItems);
  }

  return (
    <div className="w-full">
      <ul
        ref={animationParent}
        className="mx-auto flex max-w-lg flex-col items-stretch gap-1"
      >
        <NewTemplateItem template={template} onCreate={handleItemAdded} />

        {itemsByCategory.map(({ category, items }) => (
          <Fragment key={category}>
            <h3 key={`title_${category}`} className="font-semibold text-lg">
              {category}
            </h3>

            {items.map((item: ItemWithIndex) => (
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
