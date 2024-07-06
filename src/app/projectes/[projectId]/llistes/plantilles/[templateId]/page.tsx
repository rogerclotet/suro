import { checkAuth } from "@/lib/check-auth";
import { getTemplate } from "@/server/lists";
import { LayoutTemplate } from "lucide-react";
import Link from "next/link";
import TemplateItems from "./_components/template-items";

export default async function TemplatePage({
  params: { projectId, templateId },
}: {
  params: { projectId: string; templateId: string };
}) {
  await checkAuth();

  const template = await getTemplate(templateId);
  if (!template) {
    return (
      <div className="space-y-4">
        <div className="alert alert-error">{"No s'ha trobat la plantilla"}</div>
        <Link href="/" className="btn btn-neutral">
          Tornar a la pàgina principal
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="breadcrumbs pb-4 text-sm">
        <ul>
          <li>
            <Link href={`/projectes/${projectId}/llistes`}>Llistes</Link>
          </li>
          <li>
            <Link href={`/projectes/${projectId}/llistes/plantilles`}>
              Plantilles
            </Link>
          </li>
        </ul>
      </div>

      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <LayoutTemplate /> {template.name}
        </h1>
      </div>

      {template.description && (
        <p
          dangerouslySetInnerHTML={{
            __html: template.description.replaceAll("\n", "<br/>"),
          }}
          className="pb-6"
        />
      )}

      <TemplateItems items={template.items} />
    </div>
  );
}
