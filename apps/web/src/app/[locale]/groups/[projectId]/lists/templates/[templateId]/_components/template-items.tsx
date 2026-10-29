"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useCallback, useMemo, useState } from "react";
import type { Template } from "@/app/_data/list";
import { SECTION_PRESENCE } from "@/components/motion/list-transitions";
import { MotionProvider } from "@/components/motion/motion-provider";
import NewTemplateItem from "./new-template-item";
import TemplateItem from "./template-item";

type Item = Template["items"][number];
/**
 * Template items have no ids, and positions shift on delete, so each row gets
 * a client key for its lifetime: it keeps the row's form state and lets its
 * layout animate when it moves to another category.
 */
type KeyedItem = Item & { key: string };

const withKey = (item: Item): KeyedItem => ({
  ...item,
  key: crypto.randomUUID(),
});
const withoutKey = ({ name, category }: KeyedItem): Item => ({
  name,
  category,
});

function groupItemsByCategory(items: KeyedItem[]) {
  const categories = new Map<string, KeyedItem[]>();
  for (const item of items) {
    const category = item.category ?? "";
    const bucket = categories.get(category);
    if (bucket) {
      bucket.push(item);
    } else {
      categories.set(category, [item]);
    }
  }
  return [...categories.entries()]
    .map(([category, categoryItems]) => ({
      category,
      items: categoryItems.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

export default function TemplateItems({ template }: { template: Template }) {
  const [items, setItems] = useState<KeyedItem[]>(() =>
    template.items.map(withKey),
  );
  const updateTemplate = useMutation(api.templates.update);

  // Persist the full items array (Convex stores template items inline).
  const persist = useCallback(
    async (newItems: KeyedItem[]) => {
      await updateTemplate({
        templateId: template.id as Id<"listTemplates">,
        name: template.name,
        description: template.description ?? undefined,
        items: newItems.map(withoutKey),
      });
    },
    [updateTemplate, template.id, template.name, template.description],
  );

  const itemsByCategory = useMemo(() => groupItemsByCategory(items), [items]);

  async function handleItemChanged(
    key: string,
    newName: string,
    newCategory: string | null,
  ) {
    const newItems =
      newName === ""
        ? items.filter((item) => item.key !== key)
        : items.map((item) =>
            item.key === key
              ? { key, name: newName, category: newCategory }
              : item,
          );
    setItems(newItems);
    await persist(newItems);
  }

  async function handleItemAdded(item: Item) {
    const newItems = [...items, withKey(item)];
    setItems(newItems);
    await persist(newItems);
  }

  return (
    <MotionProvider>
      <div className="w-full">
        {/* `relative` anchors rows that pop out of the flow while they fade
            out, so their siblings close the gap at once. */}
        <ul className="relative mx-auto flex max-w-lg flex-col items-stretch gap-1">
          <NewTemplateItem template={template} onCreate={handleItemAdded} />

          <AnimatePresence initial={false} mode="popLayout">
            {itemsByCategory.flatMap(({ category, items }) => [
              <m.h3
                key={`title_${category}`}
                layout="position"
                {...SECTION_PRESENCE}
                className="text-lg font-semibold"
              >
                {category}
              </m.h3>,
              ...items.map((item) => (
                <TemplateItem
                  key={item.key}
                  template={template}
                  item={item}
                  onChange={(name, cat) =>
                    handleItemChanged(item.key, name, cat)
                  }
                />
              )),
            ])}
          </AnimatePresence>
        </ul>
      </div>
    </MotionProvider>
  );
}
