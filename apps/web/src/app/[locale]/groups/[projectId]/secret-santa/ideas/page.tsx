import GiftIdeasView from "./_components/gift-ideas-view";

export default async function GiftIdeasPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <GiftIdeasView projectId={projectId} />;
}
