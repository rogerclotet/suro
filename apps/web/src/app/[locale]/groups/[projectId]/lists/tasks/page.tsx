import { checkAuth } from "@/lib/check-auth";
import MyTasks from "./_components/my-tasks";

export default async function TasksPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  await checkAuth();

  const { projectId } = await params;

  return (
    <div className="space-y-4">
      <MyTasks projectId={projectId} />
    </div>
  );
}
