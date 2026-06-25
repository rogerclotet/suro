import { checkAuth } from "@/lib/check-auth";
import HomeDashboard from "./_components/home-dashboard";

export default async function HomePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  await checkAuth();

  const { projectId } = await params;

  return <HomeDashboard projectId={projectId} />;
}
