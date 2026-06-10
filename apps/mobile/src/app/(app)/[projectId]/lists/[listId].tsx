import { useLocalSearchParams } from "expo-router";
import { ListDetailScreen } from "@/components/list-detail";

export default function ListDetailRoute() {
  const { listId, name } = useLocalSearchParams<{
    listId: string;
    name?: string;
  }>();
  return <ListDetailScreen listId={listId} initialTitle={name} />;
}
