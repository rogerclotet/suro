"use client";

import type { List } from "@/app/_data/list";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";

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
    router.push({
      pathname: "/groups/[projectId]/lists/[listId]",
      params: { projectId, listId },
    });
  }

  return (
    <Select value={listId} onValueChange={handleChange}>
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
