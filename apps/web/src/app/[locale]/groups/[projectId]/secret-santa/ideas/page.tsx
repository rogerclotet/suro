import { checkAuth } from "@/lib/check-auth";
import GiftIdeasView from "./_components/gift-ideas-view";

export default async function GiftIdeasPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  await checkAuth();

  const { projectId } = await params;
  return <GiftIdeasView projectId={projectId} />;
}
