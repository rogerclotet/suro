import { checkAuth } from "@/lib/check-auth";
import PotsList from "./_components/pots-list";

export default async function DespesesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  await checkAuth();

  const { projectId } = await params;

  return <PotsList projectId={projectId} />;
}
