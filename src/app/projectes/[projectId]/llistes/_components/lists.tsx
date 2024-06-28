"use client";

import type { List } from "@/app/_data/list";
import ListPreview from "./list-preview";

export default function Lists({ lists }: { lists: List[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {lists.map((list) => (
        <ListPreview key={list.id} list={list} />
      ))}
    </div>
  );
}
