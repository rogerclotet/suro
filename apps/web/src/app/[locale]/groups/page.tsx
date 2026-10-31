import { checkAuth } from "@/lib/check-auth";
import GroupsScreen from "./_components/groups-screen";

export default async function GroupsPage() {
  await checkAuth();
  return <GroupsScreen />;
}
