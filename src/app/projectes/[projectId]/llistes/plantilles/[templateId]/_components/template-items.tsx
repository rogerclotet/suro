"use client";

import type { Template } from "@/app/_data/list";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import React, { Fragment } from "react";

export default function TemplateItems({ items }: { items: Template["items"] }) {
  const [itemsByCategory, setItemsByCategory] = React.useState(
    groupItemsByCategory(items),
  );
  const [animationParent] = useAutoAnimate();

  React.useEffect(() => {
    setItemsByCategory(groupItemsByCategory(items));
  }, [items]);

  return (
    <div className="w-full">
      <ul
        ref={animationParent}
        className="mx-auto flex flex-col items-stretch gap-1 lg:max-w-lg"
      >
        {itemsByCategory.map(({ category, items }) => (
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

function groupItemsByCategory(items: Template["items"]) {
  const categories = new Map<string, Template["items"]>();

  for (const item of items) {
    const category = item.category;
    if (!categories.has(category)) {
      categories.set(category, []);
    }

    categories.get(category)!.push(item);
  }

  const result = [];
  for (const [category, items] of categories.entries()) {
    result.push({ category, items });
  }

  result.sort((a, b) => a.category.localeCompare(b.category));

  return result;
}
