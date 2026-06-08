import { useLocalSearchParams } from "expo-router";
import { ListDetailScreen } from "@/components/list-detail";

/**
 * A list opened from an event lives in the calendar stack (not the lists tab)
 * so the back button returns to the event the user came from rather than the
 * lists index. Renders the same screen as `lists/[listId]`.
 */
export default function CalendarListDetailRoute() {
  const { listId, name } = useLocalSearchParams<{
    listId: string;
    name?: string;
  }>();
  return <ListDetailScreen listId={listId} initialTitle={name} />;
}
