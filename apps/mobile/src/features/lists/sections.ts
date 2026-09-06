import { compareTaskItems } from "@/lib/task-order";
import type { Item, Section } from "./types";

function compareItems(a: Item, b: Item): number {
  if (a.completed !== b.completed) {
    return a.completed ? 1 : -1;
  }
  const byName = a.name.localeCompare(b.name);
  return byName !== 0 ? byName : a._id.localeCompare(b._id);
}

export function groupByCategory(
  items: Item[],
  uncategorized: string,
  taskMode: boolean,
): Section[] {
  // Task lists order each section by due date/priority (matching the backend and
  // the "My tasks" agenda); plain checklists keep the name-only order.
  const compare = taskMode ? compareTaskItems<Item> : compareItems;
  const groups = new Map<string | null, Section>();
  for (const item of [...items].sort(compare)) {
    const category = item.category ?? null;
    const title = category ?? uncategorized;
    const bucket = groups.get(category);
    if (bucket) {
      bucket.data.push(item);
    } else {
      groups.set(category, { title, category, data: [item] });
    }
  }
  // The uncategorized bucket always sorts first so its items sit right below
  // the always-visible add row at the top (the no-category entry point).
  return [...groups.values()].sort((a, b) => {
    if (a.category === null) return -1;
    if (b.category === null) return 1;
    return a.title.localeCompare(b.title);
  });
}
