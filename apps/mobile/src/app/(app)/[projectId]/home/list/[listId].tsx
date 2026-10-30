import { useLocalSearchParams } from "expo-router";
import { ListDetailScreen } from "@/components/list-detail";

/**
 * A list opened from Home (a favorite, or one attached to an event opened
 * there) lives in the Home stack so the back button returns to where the user
 * came from. Renders the same screen as `lists/[listId]`.
 */
export default function HomeListDetailRoute() {
  const { listId, name } = useLocalSearchParams<{
    listId: string;
    name?: string;
  }>();
  return <ListDetailScreen listId={listId} initialTitle={name} />;
}
