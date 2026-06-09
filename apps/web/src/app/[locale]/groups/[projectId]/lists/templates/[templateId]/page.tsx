import { checkAuth } from "@/lib/check-auth";
import TemplateDetail from "./_components/template-detail";

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ projectId: string; templateId: string }>;
}) {
  await checkAuth();

  const { templateId } = await params;

  return <TemplateDetail templateId={templateId} />;
}
