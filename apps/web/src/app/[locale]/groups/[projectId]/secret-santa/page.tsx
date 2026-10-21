import SecretSantaView from "./_components/secret-santa-view";

export default async function SecretSantaPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <SecretSantaView projectId={projectId} />;
}
