"use client";

import { useRouter } from "next/navigation";
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
  projectId,
}: {
  listId: string;
  lists: List[];
  projectId: string;
}) {
  const router = useRouter();

  function handleChange(listId: string) {
    router.push(`/grups/${projectId}/llistes/${listId}`);
  }

  return (
    <Select value={listId} onValueChange={handleChange}>
      <SelectTrigger className="gap-2 text-xl font-semibold">
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
