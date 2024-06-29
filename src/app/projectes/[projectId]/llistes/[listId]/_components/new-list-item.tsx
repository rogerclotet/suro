import type { List } from "@/app/_data/list";
import { createListItem } from "./actions";
import ListItem from "./list-item";

export default function NewListItem({
  list,
  onCreated,
}: {
  list: List;
  onCreated?: (name: string) => void;
}) {
  async function handleChange(name: string, completed: boolean) {
    onCreated?.(name);
    await createListItem(list, name, completed);
  }

  return <ListItem name="" completed={false} onChange={handleChange} />;
}
