"use client";

import type { List } from "@/app/_data/list";
import { useProjectLists } from "@/lib/queries/use-project-lists";

export default function ListsTQPrimer({
  projectId,
  lists,
}: {
  projectId: string;
  lists: List[];
}) {
  useProjectLists(projectId, lists);
  return null;
}
