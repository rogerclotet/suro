import { checkAuth } from "@/lib/check-auth";
import GroupSettings from "./_components/group-settings";

export default async function GroupSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  await checkAuth();
  const { projectId } = await params;
  return <GroupSettings projectId={projectId} />;
}
