import { getTranslations } from "next-intl/server";
import { checkAuth } from "@/lib/check-auth";
import MyTasks from "./_components/my-tasks";

export default async function TasksPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  await checkAuth();

  const { projectId } = await params;
  const t = await getTranslations("lists");

  return (
    <div className="space-y-4">
      <h1 className="mx-auto w-full max-w-lg px-4 text-xl font-bold tracking-tight">
        {t("myTasks")}
      </h1>
      <MyTasks projectId={projectId} />
    </div>
  );
}
