"use client";

import type { List } from "@/app/_data/list";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ListsDropdown({
  listId,
  lists,
  onListChange,
}: {
  listId: string;
  lists: List[];
  onListChange: (listId: string) => void;
}) {
  return (
    <Select value={listId} onValueChange={onListChange}>
      <SelectTrigger className="gap-2 font-semibold text-xl">
        <SelectValue placeholder="Llista" />
      </SelectTrigger>
      <SelectContent>
        {lists.map((list) => (
          <SelectItem key={list.id} value={list.id}>
            {list.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
