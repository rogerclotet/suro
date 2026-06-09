import { checkAuth } from "@/lib/check-auth";
import FilesView from "./_components/files-view";

export default async function FilesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  await checkAuth();

  const { projectId } = await params;

  return <FilesView projectId={projectId} />;
}
