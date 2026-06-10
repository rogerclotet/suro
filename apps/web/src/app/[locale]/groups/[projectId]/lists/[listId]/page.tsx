import { checkAuth } from "@/lib/check-auth";
import ListsClientContainer from "./_components/lists-client-container";

export default async function ListPage({
  params,
}: {
  params: Promise<{ projectId: string; listId: string }>;
}) {
  await checkAuth();

  const { projectId, listId } = await params;

  return <ListsClientContainer initialListId={listId} projectId={projectId} />;
}
