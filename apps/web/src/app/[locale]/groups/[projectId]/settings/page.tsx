import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Group settings only ever exposed the Secret Santa feature toggle, which is
// disabled until Secret Santa is ported to Convex. The page is parked (and its
// nav entry hidden) until settings are rebuilt on Convex; this covers deep
// links by sending admins back to the group.
export default async function GroupSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  const { projectId } = await params;
  redirect(`/groups/${projectId}/home`);
}
