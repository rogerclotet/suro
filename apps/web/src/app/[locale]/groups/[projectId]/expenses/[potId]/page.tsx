import { checkAuth } from "@/lib/check-auth";
import PotDetailView from "./_components/pot-detail-view";

export default async function PotPage({
  params,
}: {
  params: Promise<{ projectId: string; potId: string }>;
}) {
  await checkAuth();

  const { projectId, potId } = await params;

  return <PotDetailView projectId={projectId} potId={potId} />;
}
