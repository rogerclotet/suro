import { checkAuth } from "@/lib/check-auth";
import Lists from "./_components/lists";

export default async function ListesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  await checkAuth();

  const { projectId } = await params;

  return (
    <div className="space-y-4">
      <Lists projectId={projectId} />
    </div>
  );
}
