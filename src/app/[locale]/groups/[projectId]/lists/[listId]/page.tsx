import { checkAuth } from "@/lib/check-auth";
import { getLists, getTemplates } from "@/server/lists";
import ListsClientContainer from "./_components/lists-client-container";

export default async function ListPage({
  params,
}: {
  params: Promise<{ projectId: string; listId: string }>;
}) {
  await checkAuth();

  const { projectId, listId } = await params;

  const [lists, templates] = await Promise.all([
    getLists(projectId),
    getTemplates(projectId),
  ]);

  return (
    <ListsClientContainer
      initialLists={lists}
      initialListId={listId}
      projectId={projectId}
      templates={templates}
    />
  );
}
